import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Eye, Building } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

interface BusinessVerificationRequest {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  tax_id: string;
  website: string;
  description: string;
  documents: any;
  status: string;
  admin_notes: string;
  reviewed_by: string;
  reviewed_at: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    username: string | null;
  } | null;
}

export default function BusinessVerifications() {
  const [selectedRequest, setSelectedRequest] = useState<BusinessVerificationRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['business-verification-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_verification_requests')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as any[];
    },
  });

  const updateRequestStatus = useMutation({
    mutationFn: async ({ 
      id, 
      status, 
      notes,
      shouldUpdateProfile = false 
    }: { 
      id: string; 
      status: string; 
      notes: string;
      shouldUpdateProfile?: boolean;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      // Update verification request
      const { error: requestError } = await supabase
        .from('business_verification_requests')
        .update({
          status,
          admin_notes: notes,
          reviewed_by: user.user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (requestError) throw requestError;

      // If approved, update user profile
      if (status === 'approved' && shouldUpdateProfile && selectedRequest) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            account_type: 'business',
            is_verified: true,
            verification_badge: 'business',
            business_name: selectedRequest.business_name,
            business_description: selectedRequest.description,
          })
          .eq('id', selectedRequest.user_id);

        if (profileError) throw profileError;
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['business-verification-requests'] });
      toast({ 
        title: `Заявку ${status === 'approved' ? 'схвалено' : 'відхилено'}`,
        description: status === 'approved' ? 'Користувач отримав бізнес-статус' : undefined
      });
      setSelectedRequest(null);
      setAdminNotes('');
    },
    onError: () => {
      toast({
        title: 'Помилка',
        description: 'Не вдалося обробити заявку',
        variant: 'destructive',
      });
    },
  });

  const handleApprove = () => {
    if (!selectedRequest) return;
    updateRequestStatus.mutate({
      id: selectedRequest.id,
      status: 'approved',
      notes: adminNotes,
      shouldUpdateProfile: true,
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    updateRequestStatus.mutate({
      id: selectedRequest.id,
      status: 'rejected',
      notes: adminNotes,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Очікує</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Схвалено</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Відхилено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        
        <main className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Верифікація бізнес-акаунтів</h1>
              <p className="text-muted-foreground mt-2">
                Модерація заявок на отримання бізнес-статусу
              </p>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="mt-2">
                  {pendingCount} заявок очікує розгляду
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">Завантаження...</div>
            ) : requests?.length === 0 ? (
              <Card className="p-8 text-center">
                <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Немає заявок</h3>
                <p className="text-muted-foreground">
                  Поки що немає заявок на верифікацію бізнес-акаунтів
                </p>
              </Card>
            ) : (
              requests?.map((request) => (
                <Card key={request.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{request.business_name}</h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Користувач:</span>
                          <span className="ml-2">{request.profiles?.full_name || request.profiles?.username || 'Невідомо'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Тип бізнесу:</span>
                          <span className="ml-2">{request.business_type}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Податковий номер:</span>
                          <span className="ml-2">{request.tax_id}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Подано:</span>
                          <span className="ml-2">
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true, locale: uk })}
                          </span>
                        </div>
                      </div>
                      
                      {request.description && (
                        <p className="text-muted-foreground">{request.description}</p>
                      )}
                      
                      {request.admin_notes && (
                        <div className="p-3 bg-muted rounded-lg">
                          <span className="text-sm font-medium">Примітки адміністратора:</span>
                          <p className="text-sm mt-1">{request.admin_notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.admin_notes || '');
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Переглянути
                        </Button>
                      </DialogTrigger>
                      
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Деталі заявки - {selectedRequest?.business_name}</DialogTitle>
                        </DialogHeader>
                        
                        {selectedRequest && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <Label className="text-muted-foreground">Користувач</Label>
                                <p>{selectedRequest.profiles?.full_name || selectedRequest.profiles?.username || 'Невідомо'}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Статус</Label>
                                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Назва бізнесу</Label>
                                <p>{selectedRequest.business_name}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Тип бізнесу</Label>
                                <p>{selectedRequest.business_type}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Податковий номер</Label>
                                <p>{selectedRequest.tax_id}</p>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Веб-сайт</Label>
                                <p>{selectedRequest.website || 'Не вказано'}</p>
                              </div>
                            </div>
                            
                            {selectedRequest.description && (
                              <div>
                                <Label className="text-muted-foreground">Опис</Label>
                                <p className="mt-1">{selectedRequest.description}</p>
                              </div>
                            )}
                            
                            <div>
                              <Label htmlFor="admin_notes">Примітки адміністратора</Label>
                              <Textarea
                                id="admin_notes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Додайте коментар до рішення..."
                                rows={3}
                                className="mt-1"
                              />
                            </div>
                            
                            {selectedRequest.status === 'pending' && (
                              <div className="flex gap-3 pt-4">
                                <Button
                                  onClick={handleReject}
                                  variant="outline"
                                  className="flex-1 text-red-600 hover:text-red-700"
                                  disabled={updateRequestStatus.isPending}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Відхилити
                                </Button>
                                <Button
                                  onClick={handleApprove}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  disabled={updateRequestStatus.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Схвалити
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}