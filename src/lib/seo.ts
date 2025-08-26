/**
 * SEO utilities for generating friendly URLs
 */

// Транслитерация кириллицы в латиницу
const transliterationMap: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye',
  'ж': 'zh', 'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l',
  'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
  'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '',
  'ю': 'yu', 'я': 'ya',
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'H', 'Ґ': 'G', 'Д': 'D', 'Е': 'E', 'Є': 'Ye',
  'Ж': 'Zh', 'З': 'Z', 'И': 'Y', 'І': 'I', 'Ї': 'Yi', 'Й': 'Y', 'К': 'K', 'Л': 'L',
  'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
  'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Shch', 'Ь': '',
  'Ю': 'Yu', 'Я': 'Ya'
};

/**
 * Транслитерирует кириллицу в латиницу
 */
export function transliterate(text: string): string {
  return text
    .split('')
    .map(char => transliterationMap[char] || char)
    .join('');
}

/**
 * Генерирует SEO-friendly slug из названия
 */
export function generateSlug(title: string): string {
  return transliterate(title)
    .toLowerCase()
    .trim()
    // Заменяем пробелы и специальные символы на дефисы
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    // Убираем множественные дефисы
    .replace(/-+/g, '-')
    // Убираем дефисы в начале и конце
    .replace(/^-+|-+$/g, '')
    // Ограничиваем длину
    .substring(0, 60);
}

/**
 * Генерирует случайный идентификатор из 6 символов
 */
export function generateRandomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Генерирует полный SEO-friendly URL для объявления
 */
export function generateListingUrl(title: string, id: string): string {
  const slug = generateSlug(title);
  const randomId = generateRandomId();
  return `/${slug}-${randomId}`;
}

/**
 * Извлекает ID объявления из SEO-friendly URL
 */
export function extractListingIdFromUrl(url: string): string | null {
  // Ищем последние 6 символов после последнего дефиса
  const match = url.match(/-([a-zA-Z0-9]{6})$/);
  return match ? match[1] : null;
}

/**
 * Проверяет, является ли URL SEO-friendly
 */
export function isSeoUrl(url: string): boolean {
  return /^\/[a-z0-9-]+-[a-zA-Z0-9]{6}$/.test(url);
}

/**
 * Создает короткий slug для категорий
 */
export function generateCategorySlug(name: string): string {
  return transliterate(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30);
}