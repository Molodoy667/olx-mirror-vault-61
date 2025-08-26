import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ConversationsList } from '@/components/ConversationsList';
import { ChatInterface } from '@/components/ChatInterface';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export default function Chat() {
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    otherUserId: string;
    listingId?: string;
  } | null>(null);

  const handleSelectConversation = (conversationId: string, otherUserId: string) => {
    setSelectedConversation({
      id: conversationId,
      otherUserId,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Повідомлення
              </h2>
              <ConversationsList onSelectConversation={handleSelectConversation} />
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            {selectedConversation ? (
              <ChatInterface
                conversationId={selectedConversation.id}
                otherUserId={selectedConversation.otherUserId}
                listingId={selectedConversation.listingId}
              />
            ) : (
              <Card className="h-96 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>Оберіть розмову для початку спілкування</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}