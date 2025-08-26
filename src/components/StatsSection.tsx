import { Users, Package, MapPin, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const StatsSection = () => {
  // Получаем актуальную статистику
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: totalListings },
        { count: activeListings },
        { data: locations }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('listings').select('location').eq('status', 'active').limit(1000)
      ]);

      // Подсчитываем уникальные города
      const uniqueLocations = new Set(
        locations?.map(l => l.location.split(',')[0].trim()) || []
      );

      return {
        totalUsers: totalUsers || 0,
        totalListings: totalListings || 0,
        activeListings: activeListings || 0,
        uniqueLocations: uniqueLocations.size || 0
      };
    },
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });

  const statsData = [
    {
      icon: Users,
      value: stats?.totalUsers ? `${Math.floor(stats.totalUsers / 1000)}К+` : "5К+",
      label: "Активних користувачів",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      icon: Package,
      value: stats?.activeListings ? `${Math.floor(stats.activeListings / 100)}К+` : "10К+",
      label: "Активних оголошень",
      color: "text-green-600", 
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      icon: MapPin,
      value: stats?.uniqueLocations ? `${stats.uniqueLocations}+` : "50+",
      label: "Міст України",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20"
    },
    {
      icon: TrendingUp,
      value: "98%",
      label: "Успішних угод",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20"
    }
  ];

  const trustData = [
    {
      icon: Users,
      title: "Перевірені користувачі",
      description: "Система рейтингів та відгуків для безпечних угод",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20"
    },
    {
      icon: Package,
      title: "Величезний вибір",
      description: "Від електроніки до нерухомості - знайдете все що потрібно",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20"
    },
    {
      icon: TrendingUp,
      title: "Швидкі продажі",
      description: "Продавайте швидко завдяки великій аудиторії покупців",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20"
    }
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Novado - #1 майданчик оголошень в Україні
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Мільйони українців довіряють нам свої покупки та продажі. Приєднуйтесь до найбільшої спільноти торгівлі!
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="group bg-card rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200 border border-border/50 hover:border-border animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`inline-flex p-3 rounded-full ${stat.bgColor} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className="text-2xl md:text-3xl font-bold mb-2">
                {stat.value}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Trust indicators */}
        <div className="bg-card rounded-xl p-8 border border-border/50">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Чому обирають Novado?</h3>
            <p className="text-muted-foreground">
              Безпека, надійність та зручність - наші головні принципи
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {trustData.map((item, index) => (
              <div key={index} className="text-center group hover:scale-105 transition-transform duration-200">
                <div className={`inline-flex p-4 rounded-full ${item.bgColor} mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <item.icon className={`w-8 h-8 ${item.color}`} />
                </div>
                <h4 className="font-semibold mb-2 text-lg">{item.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};