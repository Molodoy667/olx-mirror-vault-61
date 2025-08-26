import { Users, Package, MapPin, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export const CombinedInfoSection = () => {
  const { data: stats } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const [
        { count: totalUsers },
        { count: activeListings },
        { data: locations }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('listings').select('location').eq('status', 'active').limit(1000)
      ]);

      const uniqueLocations = new Set(
        locations?.map(l => l.location.split(',')[0].trim()) || []
      );

      return {
        totalUsers: totalUsers || 0,
        activeListings: activeListings || 0,
        uniqueLocations: uniqueLocations.size || 0
      };
    },
  });

  const statsData = [
    {
      icon: Users,
      value: stats?.totalUsers ? `${Math.floor(stats.totalUsers / 1000)}К+` : "5К+",
      label: "Користувачів",
    },
    {
      icon: Package,
      value: stats?.activeListings ? `${Math.floor(stats.activeListings / 100)}К+` : "10К+",
      label: "Оголошень",
    },
    {
      icon: MapPin,
      value: stats?.uniqueLocations ? `${stats.uniqueLocations}+` : "50+",
      label: "Міст",
    },
  ];

  return (
    <section className="py-8 bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="container mx-auto px-4">
        <div className="flex justify-center">
          {/* Stats */}
          <div className="bg-card rounded-lg p-6 border border-border/50 max-w-md">
            <h3 className="text-xl font-bold mb-4 text-center">Novado в цифрах</h3>
            <div className="grid grid-cols-3 gap-4">
              {statsData.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex p-2 rounded-full bg-primary/10 mb-2">
                    <stat.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-lg font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};