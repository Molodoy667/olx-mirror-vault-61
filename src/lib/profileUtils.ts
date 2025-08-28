import { supabase } from '@/integrations/supabase/client';

// Генерує унікальний 6-значний ID для профілю
export const generateUniqueProfileId = async (): Promise<string> => {
  const maxAttempts = 100;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Генеруємо випадковий 6-значний ID
    const profileId = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      // Перевіряємо, чи існує такий ID вже в базі
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_id')
        .eq('profile_id', profileId)
        .single();
      
      // Якщо помилка "not found" - ID вільний
      if (error && error.code === 'PGRST116') {
        return profileId;
      }
      
      // Якщо інша помилка - продовжуємо пошук
      if (error) {
        console.warn('Error checking profile ID:', error);
        continue;
      }
      
      // Якщо data існує - ID зайнятий, генеруємо новий
      if (data) {
        continue;
      }
      
      // Якщо ні data, ні error - ID вільний
      return profileId;
      
    } catch (error) {
      console.warn('Error in profile ID generation:', error);
      continue;
    }
  }
  
  // Якщо не вдалося згенерувати за 100 спроб - використовуємо timestamp
  return Date.now().toString().slice(-6);
};

// Отримати profile_id по user_id
export const getProfileIdByUserId = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('profile_id')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error getting profile ID:', error);
      return null;
    }
    
    return data?.profile_id || null;
  } catch (error) {
    console.error('Error in getProfileIdByUserId:', error);
    return null;
  }
};

// Отримати user_id по profile_id
export const getUserIdByProfileId = async (profileId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('profile_id', profileId)
      .single();
    
    if (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
    
    return data?.id || null;
  } catch (error) {
    console.error('Error in getUserIdByProfileId:', error);
    return null;
  }
};

// Форматування profile_id для URL
export const formatProfileUrl = (profileId: string | null): string => {
  if (!profileId) return '/profile';
  return `/${profileId}`;  // Формат: /123456
};

// Отримати URL профілю для користувача
export const getProfileUrlForUser = async (userId: string): Promise<string> => {
  const profileId = await getProfileIdByUserId(userId);
  if (profileId) {
    return `/${profileId}`;  // Формат: /123456
  }
  // Fallback на старий формат якщо profile_id не знайдено
  return `/profile/${userId}`;
};