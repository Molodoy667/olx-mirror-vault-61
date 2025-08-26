import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
  iconClassName?: string;
  gradient?: string;
}

export function AdminStatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  iconClassName,
  gradient = "from-blue-500/20 to-cyan-500/20"
}: AdminStatsCardProps) {
  return (
    <Card className={cn(
      "hover:shadow-elevated transition-all duration-300 hover:-translate-y-1",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn(
          "p-2 rounded-lg bg-gradient-to-br",
          gradient
        )}>
          <Icon className={cn("h-4 w-4", iconClassName)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-1">
          {typeof value === 'number' ? value.toLocaleString('uk-UA') : value}
        </div>
        
        {/* Тренд або опис */}
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground">
            <span className={cn(
              "font-medium",
              trend.isPositive === false ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
            )}>
              {trend.isPositive === false ? '↓' : '↑'} {Math.abs(trend.value)}%
            </span>
            <span className="ml-1">{trend.label}</span>
          </div>
        )}
        
        {description && !trend && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}