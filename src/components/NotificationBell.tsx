import { useState, useEffect } from "react";
import { Bell, X, Eye, MessageCircle, Heart, Star, User, ExternalLink, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { uk } from "date-fns/locale";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    loadNotifications();
    
    // Subscribe to real-time notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => loadNotifications()
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => loadNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.warn('Error loading notifications (table may not exist yet):', error);
        // Fallback to test notifications if table doesn't exist
        const testNotifications: Notification[] = [
          {
            id: 'test-1',
            user_id: user.id,
            type: 'new_message',
            title: 'Тестове повідомлення',
            message: 'Це тестове сповіщення для перевірки системи',
            data: {},
            is_read: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: 'test-2',
            user_id: user.id,
            type: 'favorite_added',
            title: 'Додано до обраних',
            message: 'Ваше оголошення додали до обраних',
            data: {},
            is_read: true,
            created_at: new Date(Date.now() - 3600000).toISOString(),
            updated_at: new Date(Date.now() - 3600000).toISOString(),
          }
        ];
        setNotifications(testNotifications);
        setUnreadCount(testNotifications.filter(n => !n.is_read).length);
        return;
      }

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Спочатку оновлюємо локально для швидкої реакції UI
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Якщо це не тестове сповіщення, намагаємося оновити в базі
      if (!notificationId.startsWith('test-')) {
        const { error } = await supabase.rpc('mark_notifications_as_read', {
          notification_ids: [notificationId]
        });

        if (error) {
          console.warn('Could not mark notification as read in database:', error);
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      // Спочатку оновлюємо локально
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);

      // Оновлюємо тільки реальні сповіщення в базі
      const realIds = unreadIds.filter(id => !id.startsWith('test-'));
      if (realIds.length > 0) {
        const { error } = await supabase.rpc('mark_notifications_as_read', {
          notification_ids: realIds
        });

        if (error) {
          console.warn('Could not mark all notifications as read in database:', error);
        }
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_message": return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case "favorite_added": return <Heart className="w-4 h-4 text-red-500" />;
      case "listing_views": return <Eye className="w-4 h-4 text-green-500" />;
      case "price_offer": return <Gift className="w-4 h-4 text-purple-500" />;
      case "login_success": return <User className="w-4 h-4 text-green-600" />;
      case "registration_success": return <User className="w-4 h-4 text-blue-600" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    markAsRead(notification.id);
    
    // Навігація залежно від типу сповіщення
    switch (notification.type) {
      case 'new_message':
        if (notification.data?.sender_id) {
          navigate(`/messages/${notification.data.sender_id}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'favorite_added':
      case 'listing_views':
      case 'price_offer':
        if (notification.data?.listing_id) {
          // Навігація прямо по ID оголошення (новий формат)
          navigate(`/${notification.data.listing_id}`);
        }
        break;
      default:
        break;
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Сповіщення</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Позначити всі
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="max-h-80">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Завантажуємо...
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors ${
                    !notification.is_read ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-sm text-muted-foreground truncate">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: uk,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Сповіщень поки немає</p>
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              className="w-full text-sm"
              onClick={() => navigate('/notifications')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Переглянути всі
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}