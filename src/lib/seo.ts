/**
 * SEO utilities for generating friendly URLs
 */

import { supabase } from '@/integrations/supabase/client';

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
 * Создает или получает SEO URL для объявления
 */
export async function getOrCreateSeoUrl(listingId: string, title: string): Promise<string> {
  try {
    // Сначала пытаемся найти существующий SEO URL
    const { data: existingUrl } = await supabase
      .from('seo_urls')
      .select('full_url')
      .eq('listing_id', listingId)
      .single();

    if (existingUrl) {
      return existingUrl.full_url;
    }

    // Если SEO URL не существует, создаем новый
    const slug = generateSlug(title);
    // Используем существующий listing ID (первые 8 символов без дефисов)
    const cleanId = listingId.replace(/-/g, '');
    const seoId = cleanId.length >= 8 ? cleanId.substring(0, 8).toUpperCase() : cleanId.toUpperCase();
    const fullUrl = `/${slug}-${seoId}`;
    
    console.log('🔍 Creating SEO URL:', { listingId, slug, seoId, fullUrl });

    // Сохраняем в базу данных
    const { error } = await supabase
      .from('seo_urls')
      .insert({
        listing_id: listingId,
        slug,
        seo_id: seoId,
        full_url: fullUrl
      });

    if (error) {
      console.error('Error creating SEO URL:', error);
      // В случае ошибки возвращаем старый формат
      return `/listing/${listingId}`;
    }

    return fullUrl;
  } catch (error) {
    console.error('Error in getOrCreateSeoUrl:', error);
    // В случае ошибки возвращаем старый формат
    return `/listing/${listingId}`;
  }
}

/**
 * Получает SEO URL для объявления (без создания)
 */
export async function getSeoUrl(listingId: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('seo_urls')
      .select('full_url')
      .eq('listing_id', listingId)
      .single();

    return data?.full_url || null;
  } catch (error) {
    console.error('Error getting SEO URL:', error);
    return null;
  }
}

/**
 * Получает ID объявления по SEO URL
 */
export async function getListingIdBySeoUrl(seoUrl: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('seo_urls')
      .select('listing_id')
      .eq('full_url', seoUrl)
      .single();

    return data?.listing_id || null;
  } catch (error) {
    console.error('Error getting listing ID by SEO URL:', error);
    return null;
  }
}

/**
 * Очищает и пересоздает SEO URL для всех объявлений
 */
export async function regenerateAllSeoUrls(): Promise<{ success: number; errors: number }> {
  try {
    let success = 0;
    let errors = 0;

    // Получаем все объявления
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title')
      .eq('status', 'active');

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      return { success: 0, errors: 1 };
    }

    if (!listings || listings.length === 0) {
      console.log('No active listings found');
      return { success: 0, errors: 0 };
    }

    console.log(`🔄 Regenerating SEO URLs for ${listings.length} listings...`);

    // Удаляем все старые SEO URL
    const { error: deleteError } = await supabase
      .from('seo_urls')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Удаляем все

    if (deleteError) {
      console.error('Error deleting old SEO URLs:', deleteError);
    } else {
      console.log('✅ Deleted all old SEO URLs');
    }

    // Создаем новые SEO URL для каждого объявления
    for (const listing of listings) {
      try {
        const slug = generateSlug(listing.title);
        const cleanId = listing.id.replace(/-/g, '');
        const seoId = cleanId.length >= 8 ? cleanId.substring(0, 8).toUpperCase() : cleanId.toUpperCase();
        const fullUrl = `/${slug}-${seoId}`;

        const { error: insertError } = await supabase
          .from('seo_urls')
          .insert({
            listing_id: listing.id,
            slug: slug,
            seo_id: seoId,
            full_url: fullUrl
          });

        if (insertError) {
          console.error(`❌ Error creating SEO URL for ${listing.id}:`, insertError);
          errors++;
        } else {
          console.log(`✅ Created SEO URL for ${listing.title}: ${fullUrl}`);
          success++;
        }
      } catch (error) {
        console.error(`❌ Error processing listing ${listing.id}:`, error);
        errors++;
      }
    }

    console.log(`🎉 Regeneration complete: ${success} success, ${errors} errors`);
    return { success, errors };
  } catch (error) {
    console.error('Error in regenerateAllSeoUrls:', error);
    return { success: 0, errors: 1 };
  }
}

/**
 * Генерирует полный SEO-friendly URL для объявления (устаревший метод)
 * @deprecated Используйте getOrCreateSeoUrl
 */
export function generateListingUrl(title: string, id: string): string {
  const slug = generateSlug(title);
  const randomId = generateRandomId();
  return `/${slug}-${randomId}`;
}

/**
 * Извлекает ID объявления из SEO-friendly URL (устаревший метод)
 * @deprecated Используйте getListingIdBySeoUrl
 */
export function extractListingIdFromUrl(url: string): string | null {
  // Ищем последние 6-8 символов после последнего дефиса
  const match = url.match(/-([a-zA-Z0-9]{6,8})$/);
  return match ? match[1] : null;
}

/**
 * Проверяет, является ли URL SEO-friendly
 */
export function isSeoUrl(url: string): boolean {
  // Підтримуємо як 6-символьні (старі), так і 8-символьні (нові) SEO ID
  return /^\/[a-z0-9-]+-[a-zA-Z0-9]{6,8}$/.test(url);
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