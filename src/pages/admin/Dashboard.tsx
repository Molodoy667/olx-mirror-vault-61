import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Package, 
  MessageCircle, 
  Heart,
  BarChart,
  AlertCircle,
  Shield,
  Settings
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [stats, setStats] = useState({
    total_users: 0,
    active_listings: 0,
    inactive_listings: 0,
    total_messages: 0,
    total_favorites: 0,
    total_categories: 0,
  });

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Панель адміністратора
            </h1>
            <p className="text-muted-foreground mt-1">Керуйте вашим маркетплейсом</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-6">
            <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Всього користувачів
                </CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600 dark:text-green-400">↑ 12%</span> з минулого місяця
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Активні оголошення
                </CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-teal-500/20">
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.active_listings}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +{stats.inactive_listings} неактивні
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Повідомлення
                </CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_messages}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600 dark:text-green-400">↑ 8%</span> активність
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  В обраному
                </CardTitle>
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20">
                  <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_favorites}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Всього додано
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Швидкі дії</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <Button 
                  onClick={() => navigate('/admin/users')}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark hover:shadow-glow transition-all duration-300"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Управління</span> Користувачами
                </Button>
                <Button 
                  onClick={() => navigate('/admin/listings')}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark hover:shadow-glow transition-all duration-300"
                >
                  <Package className="w-4 h-4" />
                  <span className="hidden sm:inline">Управління</span> Оголошеннями
                </Button>
                <Button 
                  onClick={() => navigate('/admin/categories')}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark hover:shadow-glow transition-all duration-300"
                >
                  <BarChart className="w-4 h-4" />
                  <span className="hidden sm:inline">Управління</span> Категоріями
                </Button>
                <Button 
                  onClick={() => navigate('/admin/settings')}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Settings className="w-4 h-4" />
                  Налаштування
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Tabs defaultValue="users" className="space-y-4">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 sm:inline-grid">
              <TabsTrigger value="users">Нові користувачі</TabsTrigger>
              <TabsTrigger value="listings">Нові оголошення</TabsTrigger>
              <TabsTrigger value="reports">Скарги</TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Останні реєстрації</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Тут будуть відображатися останні зареєстровані користувачі
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="listings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Останні оголошення</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Тут будуть відображатися останні додані оголошення
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Останні скарги</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Тут будуть відображатися останні скарги від користувачів
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}