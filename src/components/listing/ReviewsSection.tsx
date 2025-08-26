import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Star, MessageCircle, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

interface ReviewsSectionProps {
  listingId: string;
}

export function ReviewsSection({ listingId }: ReviewsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', listingId],
    queryFn: async () => {
      const { data: reviewsData, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each review
      const reviewsWithProfiles = await Promise.all(
        (reviewsData || []).map(async (review) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', review.user_id)
            .maybeSingle();

          return {
            ...review,
            profiles: profileData,
          };
        })
      );

      return reviewsWithProfiles;
    },
  });

  const createReview = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Потрібна авторизація');
      
      const { error } = await supabase
        .from('reviews')
        .insert({
          listing_id: listingId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', listingId] });
      setComment('');
      setRating(5);
      setShowForm(false);
      toast({
        title: "Відгук додано",
        description: "Дякуємо за ваш відгук!",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося додати відгук",
        variant: "destructive",
      });
    },
  });

  const averageRating = reviews?.length 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Відгуки та оцінки
          </h3>
          {reviews && reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(averageRating)
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {averageRating.toFixed(1)} ({reviews.length} відгуків)
              </span>
            </div>
          )}
        </div>
        
        {user && !showForm && (
          <Button onClick={() => setShowForm(true)} variant="outline">
            Залишити відгук
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-accent/10 rounded-lg space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ваша оцінка</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      value <= rating
                        ? 'fill-warning text-warning'
                        : 'text-muted-foreground hover:text-warning'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Коментар (необов'язково)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Поділіться вашим досвідом..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => createReview.mutate()}
              disabled={createReview.isPending}
            >
              Опублікувати відгук
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowForm(false);
                setComment('');
                setRating(5);
              }}
            >
              Скасувати
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Завантаження відгуків...
          </div>
        ) : reviews && reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="border-b last:border-0 pb-4 last:pb-0">
              <div className="flex items-start gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {review.profiles?.full_name || review.profiles?.username || 'Користувач'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: uk,
                      })}
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating
                            ? 'fill-warning text-warning'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {review.comment && (
                    <p className="text-muted-foreground mt-2">{review.comment}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Поки що немає відгуків. Будьте першим!
          </div>
        )}
      </div>
    </Card>
  );
}