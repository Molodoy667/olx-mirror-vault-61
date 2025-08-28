import { supabase } from '@/integrations/supabase/client';
import { formatUserAgent } from './userAgent';

export const createLoginNotification = async (userId: string) => {
  try {
    const userAgent = await formatUserAgent();
    const currentTime = new Date().toLocaleString('uk-UA', {
      timeZone: 'Europe/Kiev',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await supabase.rpc('create_notification', {
      target_user_id: userId,
      notification_type: 'login_success',
      notification_title: 'Успішний вхід в систему',
      notification_message: `Ви увійшли в систему ${currentTime}. Пристрій: ${userAgent}`,
      notification_data: {
        login_time: new Date().toISOString(),
        user_agent: navigator.userAgent,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error creating login notification:', error);
  }
};

export const createRegistrationNotification = async (userId: string) => {
  try {
    const userAgent = await formatUserAgent();
    const currentTime = new Date().toLocaleString('uk-UA', {
      timeZone: 'Europe/Kiev',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    await supabase.rpc('create_notification', {
      target_user_id: userId,
      notification_type: 'registration_success',
      notification_title: 'Вітаємо з реєстрацією! 🎉',
      notification_message: `Ви успішно зареєструвались ${currentTime}. Пристрій: ${userAgent}`,
      notification_data: {
        registration_time: new Date().toISOString(),
        user_agent: navigator.userAgent,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error creating registration notification:', error);
  }
};

export const createPriceOfferNotification = async (
  listingOwnerId: string,
  listingTitle: string,
  offeredPrice: number,
  offerUserId: string
) => {
  try {
    await supabase.rpc('create_notification', {
      target_user_id: listingOwnerId,
      notification_type: 'price_offer',
      notification_title: 'Нова пропозиція ціни',
      notification_message: `Користувач запропонував ціну ${offeredPrice} грн за ваше оголошення "${listingTitle}"`,
      notification_data: {
        listing_title: listingTitle,
        offered_price: offeredPrice,
        offer_user_id: offerUserId,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error creating price offer notification:', error);
  }
};

export const createListingMessageNotification = async (
  receiverId: string,
  listingTitle: string,
  senderId: string,
  listingId: string
) => {
  try {
    await supabase.rpc('create_notification', {
      target_user_id: receiverId,
      notification_type: 'new_message',
      notification_title: 'Нове повідомлення на оголошення',
      notification_message: `Вам надійшло нове повідомлення на оголошення "${listingTitle}"`,
      notification_data: {
        listing_title: listingTitle,
        listing_id: listingId,
        sender_id: senderId,
        timestamp: Date.now()
      }
    });
  } catch (error) {
    console.error('Error creating listing message notification:', error);
  }
};