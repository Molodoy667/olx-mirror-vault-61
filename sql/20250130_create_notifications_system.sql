-- Create notifications system
-- Migration: 20250130_create_notifications_system.sql

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type VARCHAR(50),
  notification_title VARCHAR(255),
  notification_message TEXT DEFAULT NULL,
  notification_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB) TO authenticated;

-- 7. Create trigger function for new message notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user sends message to themselves
  IF NEW.sender_id = NEW.receiver_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for receiver
  PERFORM create_notification(
    NEW.receiver_id,
    'new_message',
    'Нове повідомлення',
    'Ви отримали нове повідомлення',
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'message_id', NEW.id,
      'listing_id', NEW.listing_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- 9. Create trigger function for favorites
CREATE OR REPLACE FUNCTION notify_new_favorite()
RETURNS TRIGGER AS $$
DECLARE
  listing_owner_id UUID;
  listing_title TEXT;
BEGIN
  -- Get listing owner and title
  SELECT user_id, title INTO listing_owner_id, listing_title
  FROM listings 
  WHERE id = NEW.listing_id;

  -- Don't notify if user favorites their own listing
  IF listing_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for listing owner
  PERFORM create_notification(
    listing_owner_id,
    'favorite_added',
    'Додано до обраних',
    'Ваше оголошення "' || listing_title || '" додали до обраних',
    jsonb_build_object(
      'listing_id', NEW.listing_id,
      'user_id', NEW.user_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for favorites
DROP TRIGGER IF EXISTS trigger_notify_new_favorite ON favorites;
CREATE TRIGGER trigger_notify_new_favorite
  AFTER INSERT ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_favorite();

-- 11. Create function for listing view notifications (called manually)
CREATE OR REPLACE FUNCTION notify_listing_views(
  listing_id UUID,
  view_count INTEGER
)
RETURNS VOID AS $$
DECLARE
  listing_owner_id UUID;
  listing_title TEXT;
BEGIN
  -- Get listing owner and title
  SELECT user_id, title INTO listing_owner_id, listing_title
  FROM listings 
  WHERE id = listing_id;

  -- Create notification for listing owner
  PERFORM create_notification(
    listing_owner_id,
    'listing_views',
    'Нові перегляди',
    'Ваше оголошення "' || listing_title || '" переглядали ' || view_count || ' разів',
    jsonb_build_object(
      'listing_id', listing_id,
      'view_count', view_count
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant execute permission
GRANT EXECUTE ON FUNCTION notify_listing_views(UUID, INTEGER) TO authenticated;

-- 13. Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, updated_at = NOW()
  WHERE id = ANY(notification_ids) AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant execute permission
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID[]) TO authenticated;

-- 15. Create function to clear old notifications
CREATE OR REPLACE FUNCTION clear_old_notifications(
  user_id_param UUID,
  days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE user_id = user_id_param 
    AND created_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Grant execute permission
GRANT EXECUTE ON FUNCTION clear_old_notifications(UUID, INTEGER) TO authenticated;

-- 17. Test notifications
SELECT 'Notification system created successfully! ✅' as status;

-- 18. Check the structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- ✅ ГОТОВО! Система сповіщень створена!