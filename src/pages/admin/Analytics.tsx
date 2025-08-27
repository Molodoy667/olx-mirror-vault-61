import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Package, 
  Eye, 
  MessageCircle,
  Heart,
  Star,
  Activity,
  DollarSign,
  Clock
} from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalListings: number;
  totalViews: number;
  totalMessages: number;
  totalFavorites: number;
  avgRating: number;
  userGrowth: { date: string; users: number }[];
  listingsByCategory: { name: string; count: number; color: string }[];
  dailyActivity: { date: string; listings: number; views: number; messages: number }[];
  topLocations: { location: string; count: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdmin();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalListings: 0,
    totalViews: 0,
    totalMessages: 0,
    totalFavorites: 0,
    avgRating: 0,
    userGrowth: [],
    listingsByCategory: [],
    dailyActivity: [],
    topLocations: []
  });
  const [period, setPeriod] = useState('30');
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    loadAnalyticsData();
  }, [period]);

  const loadAnalyticsData = async () => {
    try {
      setLoadingAnalytics(true);
      
      // Load basic stats
      const [usersResult, listingsResult, viewsResult, messagesResult, favoritesResult, ratingsResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('listings').select('id', { count: 'exact' }),
        supabase.from('listing_views').select('id', { count: 'exact' }),
        supabase.from('messages').select('id', { count: 'exact' }),
        supabase.from('favorites').select('id', { count: 'exact' }),
        supabase.from('reviews').select('rating').then(result => {
          if (result.data) {
            const avg = result.data.reduce((sum, review) => sum + review.rating, 0) / result.data.length;
            return { data: avg || 0 };
          }
          return { data: 0 };
        })
      ]);

      // Load user growth data
      const userGrowthResult = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true });

      // Process user growth data
      const userGrowth = processGrowthData(userGrowthResult.data || [], period);

      // Load listings by category
      const categoriesResult = await supabase
        .from('listings')
        .select(`
          categories:category_id(name_uk, color)
        `)
        .eq('status', 'active');

      const listingsByCategory = processCategoryData(categoriesResult.data || []);

      // Load daily activity
      const activityResult = await supabase
        .from('listings')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString());

      const viewsActivity = await supabase
        .from('listing_views')
        .select('viewed_at')
        .gte('viewed_at', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString());

      const messagesActivity = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000).toISOString());

      const dailyActivity = processActivityData(
        activityResult.data || [],
        viewsActivity.data || [],
        messagesActivity.data || [],
        period
      );

      // Load top locations
      const locationsResult = await supabase
        .from('listings')
        .select('location')
        .eq('status', 'active');

      const topLocations = processLocationData(locationsResult.data || []);

      setAnalyticsData({
        totalUsers: usersResult.count || 0,
        totalListings: listingsResult.count || 0,
        totalViews: viewsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        totalFavorites: favoritesResult.count || 0,
        avgRating: ratingsResult.data || 0,
        userGrowth,
        listingsByCategory,
        dailyActivity,
        topLocations
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const processGrowthData = (data: any[], periodDays: string) => {
    const days = parseInt(periodDays);
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = data.filter(item => 
        item.created_at.startsWith(dateStr)
      ).length;
      
      result.push({
        date: date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' }),
        users: count
      });
    }
    
    return result;
  };

  const processCategoryData = (data: any[]) => {
    const categoryCount: { [key: string]: { count: number; color?: string } } = {};
    
    data.forEach(item => {
      if (item.categories) {
        const name = item.categories.name_uk || 'Інше';
        if (!categoryCount[name]) {
          categoryCount[name] = { count: 0, color: item.categories.color };
        }
        categoryCount[name].count++;
      }
    });
    
    return Object.entries(categoryCount)
      .map(([name, data]) => ({
        name,
        count: data.count,
        color: data.color || '#8884d8'
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  const processActivityData = (listings: any[], views: any[], messages: any[], periodDays: string) => {
    const days = parseInt(periodDays);
    const result = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const listingsCount = listings.filter(item => 
        item.created_at.startsWith(dateStr)
      ).length;
      
      const viewsCount = views.filter(item => 
        item.viewed_at.startsWith(dateStr)
      ).length;
      
      const messagesCount = messages.filter(item => 
        item.created_at.startsWith(dateStr)
      ).length;
      
      result.push({
        date: date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' }),
        listings: listingsCount,
        views: viewsCount,
        messages: messagesCount
      });
    }
    
    return result;
  };

  const processLocationData = (data: any[]) => {
    const locationCount: { [key: string]: number } = {};
    
    data.forEach(item => {
      const location = item.location || 'Невказано';
      locationCount[location] = (locationCount[location] || 0) + 1;
    });
    
    return Object.entries(locationCount)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  if (loading || loadingAnalytics) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      
      <div className="flex">
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                Аналітика та звіти
              </h1>
              <p className="text-muted-foreground mt-1">Детальна статистика платформи</p>
            </div>
            
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Останні 7 днів</SelectItem>
                <SelectItem value="30">Останні 30 днів</SelectItem>
                <SelectItem value="90">Останні 90 днів</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Користувачі</p>
                    <p className="text-lg font-bold">{analyticsData.totalUsers.toLocaleString('uk-UA')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Package className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Оголошення</p>
                    <p className="text-lg font-bold">{analyticsData.totalListings.toLocaleString('uk-UA')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Eye className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Перегляди</p>
                    <p className="text-lg font-bold">{analyticsData.totalViews.toLocaleString('uk-UA')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <MessageCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Повідомлення</p>
                    <p className="text-lg font-bold">{analyticsData.totalMessages.toLocaleString('uk-UA')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <Heart className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Вподобання</p>
                    <p className="text-lg font-bold">{analyticsData.totalFavorites.toLocaleString('uk-UA')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Star className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Рейтинг</p>
                    <p className="text-lg font-bold">{analyticsData.avgRating.toFixed(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
              <TabsTrigger value="activity" className="text-xs sm:text-sm">Активність</TabsTrigger>
              <TabsTrigger value="growth" className="text-xs sm:text-sm">Зростання</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs sm:text-sm">Категорії</TabsTrigger>
              <TabsTrigger value="locations" className="text-xs sm:text-sm">Локації</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Щоденна активність
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={analyticsData.dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stackId="1" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary))" 
                        fillOpacity={0.6}
                        name="Перегляди"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="listings" 
                        stackId="1" 
                        stroke="#82ca9d" 
                        fill="#82ca9d" 
                        fillOpacity={0.6}
                        name="Оголошення"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="messages" 
                        stackId="1" 
                        stroke="#ffc658" 
                        fill="#ffc658" 
                        fillOpacity={0.6}
                        name="Повідомлення"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="growth">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Зростання користувачів
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analyticsData.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="users" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        name="Нові користувачі"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="categories">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Розподіл по категоріях</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analyticsData.listingsByCategory}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {analyticsData.listingsByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Топ категорії</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.listingsByCategory.map((category, index) => (
                        <div key={category.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{category.name}</p>
                              <p className="text-sm text-muted-foreground">{category.count} оголошень</p>
                            </div>
                          </div>
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color }}
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="locations">
              <Card>
                <CardHeader>
                  <CardTitle>Топ локації</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData.topLocations} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="location" type="category" width={100} />
                      <Tooltip />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--primary))"
                        name="Оголошень"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}