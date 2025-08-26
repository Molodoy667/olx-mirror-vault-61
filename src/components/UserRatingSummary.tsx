import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Star } from 'lucide-react';
import { useUserRatingStats } from '@/hooks/useUserRatings';

interface UserRatingSummaryProps {
  userId: string;
}

export function UserRatingSummary({ userId }: UserRatingSummaryProps) {
  const { data: stats, isLoading } = useUserRatingStats(userId);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded" />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!stats || stats.totalRatings === 0) {
    return (
      <Card className="p-4">
        <div className="text-center text-muted-foreground">
          <Star className="w-8 h-8 mx-auto mb-2" />
          <p>Немає оцінок</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Star className="w-6 h-6 text-warning fill-current" />
          <span className="text-2xl font-bold">{stats.averageRating}</span>
          <span className="text-muted-foreground">/ 5</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {stats.totalRatings} {stats.totalRatings === 1 ? 'оцінка' : 'оцінок'}
        </p>
      </div>

      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating, index) => (
          <div key={rating} className="flex items-center gap-2 text-sm">
            <span className="w-3">{rating}</span>
            <Star className="w-3 h-3 text-warning fill-current" />
            <Progress 
              value={(stats.distribution[rating - 1] / stats.totalRatings) * 100} 
              className="flex-1 h-2"
            />
            <span className="w-8 text-right text-muted-foreground">
              {stats.distribution[rating - 1]}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}