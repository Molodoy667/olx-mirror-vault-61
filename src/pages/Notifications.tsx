import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  Eye, 
  MessageCircle, 
  Heart, 
  Star, 
  User, 
  Gift, 
  Trash2, 
  MarkAsRead,
  Filter,
  Clock,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

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

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadNotifications();
  }, [user, navigate]);

  const loadNotifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити сповіщення",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase.rpc('mark_notifications_as_read', {
        notification_ids: notificationIds
      });

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) ? { ...n, is_read: true } : n
        )
      );
      
      toast({
        title: "Успішно",
        description: "Сповіщення позначено як прочитані",
      });
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося позначити сповіщення",
        variant: "destructive",
      });
    }
  };

  const clearNotifications = async (days: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.rpc('clear_old_notifications', {
        user_id_param: user.id,
        days_old: days
      });

      if (error) throw error;

      toast({
        title: "Успішно",
        description: `Сповіщення старші ${days} днів видалено`,
      });
      
      loadNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося очистити сповіщення",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_message": return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "favorite_added": return <Heart className="w-5 h-5 text-red-500" />;
      case "listing_views": return <Eye className="w-5 h-5 text-green-500" />;
      case "price_offer": return <Gift className="w-5 h-5 text-purple-500" />;
      case "login_success": return <User className="w-5 h-5 text-green-600" />;
      case "registration_success": return <User className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }
    
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
          navigate(`/listing/${notification.data.listing_id}`);
        }
        break;
      default:
        break;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.is_read;
      case 'read': return notification.is_read;
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const readCount = notifications.filter(n => n.is_read).length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Сповіщення</h1>
          </div>
          <p className="text-muted-foreground">
            Переглядайте всі ваші сповіщення та керуйте ними
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Статистика та керування */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Керування сповіщеннями
              </CardTitle>
              <CardDescription>
                Всього: {notifications.length} • Непрочитані: {unreadCount} • Прочитані: {readCount}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {unreadCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => markAsRead(notifications.filter(n => !n.is_read).map(n => n.id))}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Позначити всі як прочитані
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => clearNotifications(1)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Очистити за 1 день
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => clearNotifications(3)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Очистити за 3 дні
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => clearNotifications(0)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Очистити всі
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Фільтри */}
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">
                Всі ({notifications.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Непрочитані ({unreadCount})
              </TabsTrigger>
              <TabsTrigger value="read">
                Прочитані ({readCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={filter} className="mt-6">
              <ScrollArea className="h-[600px] pr-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="mt-2 text-muted-foreground">Завантажуємо...</p>
                  </div>
                ) : filteredNotifications.length > 0 ? (
                  <div className="space-y-3">
                    {filteredNotifications.map((notification) => (
                      <Card
                        key={notification.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          !notification.is_read ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className={`font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </h3>
                                {!notification.is_read && (
                                  <Badge variant="default" className="ml-2">
                                    Нове
                                  </Badge>
                                )}
                              </div>
                              
                              {notification.message && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {formatDistanceToNow(new Date(notification.created_at), {
                                    addSuffix: true,
                                    locale: uk,
                                  })}
                                </span>
                                
                                {notification.is_read && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Прочитано
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-medium mb-2">
                      {filter === 'unread' ? 'Немає непрочитаних сповіщень' :
                       filter === 'read' ? 'Немає прочитаних сповіщень' :
                       'Сповіщень поки немає'}
                    </h3>
                    <p className="text-muted-foreground">
                      {filter === 'all' ? 'Коли у вас з\'являться сповіщення, вони відображатимуться тут' :
                       'Перейдіть на інші вкладки для перегляду сповіщень'}
                    </p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}