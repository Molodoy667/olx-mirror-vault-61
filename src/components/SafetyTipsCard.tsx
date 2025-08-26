import { Card } from "@/components/ui/card";
import { AlertTriangle, Shield, Eye, DollarSign, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export function SafetyTipsCard() {
  const tips = [
    {
      icon: DollarSign,
      text: "Ніколи не надсилайте передоплату без гарантій",
      level: "critical"
    },
    {
      icon: MapPin,
      text: "Зустрічайтеся у безпечних публічних місцях",
      level: "warning"
    },
    {
      icon: Eye,
      text: "Ретельно перевіряйте товар перед покупкою",
      level: "info"
    },
    {
      icon: Shield,
      text: "Користуйтеся безпечними способами оплати",
      level: "info"
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "text-red-600 dark:text-red-400";
      case "warning": return "text-warning";
      case "info": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-warning/10 via-background to-red-500/5 border-warning/30 shadow-elevated hover:shadow-glow transition-all duration-300">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-warning/20">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <h4 className="font-semibold text-lg">Правила безпеки Novado</h4>
        </div>
        
        <div className="grid gap-3">
          {tips.map((tip, index) => {
            const IconComponent = tip.icon;
            return (
              <div 
                key={index} 
                className="flex items-start gap-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors duration-200"
              >
                <div className={cn(
                  "p-1.5 rounded-full flex-shrink-0",
                  tip.level === "critical" && "bg-red-100 dark:bg-red-900/30",
                  tip.level === "warning" && "bg-warning/20",
                  tip.level === "info" && "bg-primary/20"
                )}>
                  <IconComponent className={`w-4 h-4 ${getLevelColor(tip.level)}`} />
                </div>
                <span className="leading-relaxed text-sm font-medium">{tip.text}</span>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/50">
          <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <strong>Пам'ятайте:</strong> Novado не несе відповідальності за угоди між користувачами
          </p>
        </div>
      </div>
    </Card>
  );
}