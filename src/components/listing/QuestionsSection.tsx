import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { HelpCircle, MessageSquare, User, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

interface QuestionsSectionProps {
  listingId: string;
  sellerId: string;
}

export function QuestionsSection({ listingId, sellerId }: QuestionsSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [answeringId, setAnsweringId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: questions, isLoading } = useQuery({
    queryKey: ['questions', listingId],
    queryFn: async () => {
      const { data: questionsData, error } = await supabase
        .from('questions')
        .select('*')
        .eq('listing_id', listingId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each question
      const questionsWithProfiles = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', question.user_id)
            .maybeSingle();

          const { data: answererProfile } = question.answered_by
            ? await supabase
                .from('profiles')
                .select('username, full_name, avatar_url')
                .eq('id', question.answered_by)
                .maybeSingle()
            : { data: null };

          return {
            ...question,
            user_profiles: userProfile,
            answerer_profiles: answererProfile,
          };
        })
      );

      return questionsWithProfiles;
    },
  });

  const createQuestion = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Потрібна авторизація');
      
      const { error } = await supabase
        .from('questions')
        .insert({
          listing_id: listingId,
          user_id: user.id,
          question: question.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', listingId] });
      setQuestion('');
      setShowForm(false);
      toast({
        title: "Питання додано",
        description: "Продавець отримає повідомлення про ваше питання",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося додати питання",
        variant: "destructive",
      });
    },
  });

  const answerQuestion = useMutation({
    mutationFn: async (questionId: string) => {
      if (!user) throw new Error('Потрібна авторизація');
      
      const { error } = await supabase
        .from('questions')
        .update({
          answer: answer.trim(),
          answered_by: user.id,
          answered_at: new Date().toISOString(),
        })
        .eq('id', questionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', listingId] });
      setAnswer('');
      setAnsweringId(null);
      toast({
        title: "Відповідь додано",
      });
    },
    onError: () => {
      toast({
        title: "Помилка",
        description: "Не вдалося додати відповідь",
        variant: "destructive",
      });
    },
  });

  const isSeller = user?.id === sellerId;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-primary" />
          Питання та відповіді
        </h3>
        
        {user && !isSeller && !showForm && (
          <Button onClick={() => setShowForm(true)} variant="outline">
            Задати питання
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mb-6 p-4 bg-accent/10 rounded-lg space-y-4">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Введіть ваше питання..."
            rows={3}
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={() => createQuestion.mutate()}
              disabled={!question.trim() || createQuestion.isPending}
            >
              Надіслати питання
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowForm(false);
                setQuestion('');
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
            Завантаження питань...
          </div>
        ) : questions && questions.length > 0 ? (
          questions.map((q) => (
            <div key={q.id} className="border-b last:border-0 pb-4 last:pb-0 space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={q.user_profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-sm font-medium">
                      {q.user_profiles?.full_name || q.user_profiles?.username || 'Користувач'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(q.created_at), {
                        addSuffix: true,
                        locale: uk,
                      })}
                    </div>
                  </div>
                  <p className="text-foreground">{q.question}</p>
                </div>
              </div>

              {q.answer && (
                <div className="ml-11 p-3 bg-primary/5 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-primary">Відповідь продавця</span>
                        {q.answered_at && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(q.answered_at), {
                              addSuffix: true,
                              locale: uk,
                            })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm">{q.answer}</p>
                    </div>
                  </div>
                </div>
              )}

              {isSeller && !q.answer && answeringId !== q.id && (
                <div className="ml-11">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAnsweringId(q.id)}
                  >
                    <MessageSquare className="w-3 h-3 mr-2" />
                    Відповісти
                  </Button>
                </div>
              )}

              {answeringId === q.id && (
                <div className="ml-11 p-3 bg-accent/10 rounded-lg space-y-3">
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Введіть вашу відповідь..."
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => answerQuestion.mutate(q.id)}
                      disabled={!answer.trim() || answerQuestion.isPending}
                    >
                      Надіслати
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setAnsweringId(null);
                        setAnswer('');
                      }}
                    >
                      Скасувати
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8">
            Поки що немає питань. Будьте першим!
          </div>
        )}
      </div>
    </Card>
  );
}