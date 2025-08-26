import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, BarChart, Bar } from 'recharts';

interface ChartData {
  date: string;
  users?: number;
  listings?: number;
  messages?: number;
  revenue?: number;
  [key: string]: any;
}

interface AdminChartProps {
  title: string;
  description?: string;
  data: ChartData[];
  type?: 'line' | 'area' | 'bar';
  dataKeys: {
    key: string;
    name: string;
    color: string;
  }[];
  height?: number;
  className?: string;
}

export function AdminChart({
  title,
  description,
  data,
  type = 'line',
  dataKeys,
  height = 350,
  className
}: AdminChartProps) {
  // Кастомний тултіп для кращого відображення
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">
            {new Date(label).toLocaleDateString('uk-UA')}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium text-foreground">
                {typeof entry.value === 'number' ? entry.value.toLocaleString('uk-UA') : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Рендер відповідного типу графіку
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              {dataKeys.map((item, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={item.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={item.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-muted-foreground text-xs"
              tickFormatter={(value) => new Date(value).toLocaleDateString('uk-UA', { 
                month: 'short', 
                day: 'numeric' 
              })}
            />
            <YAxis className="text-muted-foreground text-xs" />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map((item, index) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                fillOpacity={1}
                fill={`url(#gradient-${index})`}
                strokeWidth={2}
                name={item.name}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-muted-foreground text-xs"
              tickFormatter={(value) => new Date(value).toLocaleDateString('uk-UA', { 
                month: 'short', 
                day: 'numeric' 
              })}
            />
            <YAxis className="text-muted-foreground text-xs" />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map((item) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                fill={item.color}
                name={item.name}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'line':
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-muted-foreground text-xs"
              tickFormatter={(value) => new Date(value).toLocaleDateString('uk-UA', { 
                month: 'short', 
                day: 'numeric' 
              })}
            />
            <YAxis className="text-muted-foreground text-xs" />
            <Tooltip content={<CustomTooltip />} />
            {dataKeys.map((item) => (
              <Line
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stroke={item.color}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name={item.name}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}