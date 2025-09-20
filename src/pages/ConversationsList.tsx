import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, User, Clock } from 'lucide-react';

interface ConversationListItem {
  id: string;
  lead_id: string;
  homeowner_id: string;
  handwerker_id: string;
  created_at: string;
  last_message_at?: string;
  lead: {
    title: string;
    status: string;
  };
  homeowner: {
    full_name: string;
    avatar_url?: string;
  };
  handwerker: {
    full_name: string;
    avatar_url?: string;
  };
  latest_message?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unread_count: number;
}

const ConversationsList = () => {
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (!user) {
      navigate('/auth');
    }
  };

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Fetch conversations where user is either homeowner or handwerker
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          lead:leads(title, status),
          homeowner:profiles!conversations_homeowner_id_fkey(full_name, avatar_url),
          handwerker:profiles!conversations_handwerker_id_fkey(full_name, avatar_url)
        `)
        .or(`homeowner_id.eq.${user.id},handwerker_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) throw conversationsError;

      // For each conversation, get the latest message and unread count
      const conversationsWithMessages = await Promise.all(
        (conversationsData || []).map(async (conversation) => {
          // Get latest message
          const { data: latestMessage } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get unread count (messages sent by other user that are not read)
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .eq('recipient_id', user.id)
            .is('read_at', null);

          return {
            ...conversation,
            latest_message: latestMessage,
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(conversationsWithMessages as any);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: "Fehler",
        description: "Die Unterhaltungen konnten nicht geladen werden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (conversation: ConversationListItem) => {
    return user?.id === conversation.homeowner_id 
      ? conversation.handwerker 
      : conversation.homeowner;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return date.toLocaleTimeString('de-CH', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 168) { // Less than a week
      return `vor ${Math.floor(diffInHours / 24)} Tagen`;
    } else {
      return date.toLocaleDateString('de-CH');
    }
  };

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Nachrichten</h1>
              <p className="text-muted-foreground">
                Verwalten Sie Ihre Unterhaltungen mit Handwerkern und Auftraggebern
              </p>
            </div>
            <Button onClick={() => navigate('/dashboard')}>
              Zurück zum Dashboard
            </Button>
          </div>

          {conversations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Unterhaltungen</h3>
                <p className="text-muted-foreground mb-4">
                  Sie haben noch keine Nachrichten. Kaufen Sie einen Auftrag oder warten Sie auf Anfragen.
                </p>
                <Button onClick={() => navigate('/search')}>
                  Aufträge durchsuchen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => {
                const otherUser = getOtherUser(conversation);
                const hasUnread = conversation.unread_count > 0;

                return (
                  <Card 
                    key={conversation.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      hasUnread ? 'border-primary' : ''
                    }`}
                    onClick={() => navigate(`/messages/${conversation.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={otherUser.avatar_url} />
                          <AvatarFallback>
                            <User className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-semibold truncate ${
                              hasUnread ? 'text-primary' : ''
                            }`}>
                              {otherUser.full_name || 'Benutzer'}
                            </h3>
                            <div className="flex items-center gap-2">
                              {hasUnread && (
                                <Badge variant="default" className="text-xs">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                              {conversation.latest_message && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(conversation.latest_message.created_at)}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-2 truncate">
                            Auftrag: {conversation.lead.title}
                          </p>

                          {conversation.latest_message ? (
                            <p className={`text-sm truncate ${
                              hasUnread ? 'font-medium' : 'text-muted-foreground'
                            }`}>
                              {conversation.latest_message.sender_id === user?.id ? 'Sie: ' : ''}
                              {truncateMessage(conversation.latest_message.content)}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              Noch keine Nachrichten
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Badge 
                            variant={conversation.lead.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {conversation.lead.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ConversationsList;