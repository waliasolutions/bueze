import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, User, Clock, ExternalLink } from 'lucide-react';
import { formatTime as formatTimeSwiss, formatTimeAgo } from '@/lib/swissTime';

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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isHandwerker } = useUserRole();

  const leadIdParam = searchParams.get('lead');

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!isMounted) return;
      
      if (!currentUser) {
        navigate('/auth');
        return;
      }
      setUser(currentUser);
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Auto-navigate to conversation if ?lead= parameter is present
  useEffect(() => {
    if (leadIdParam && conversations.length > 0 && !loading) {
      const targetConversation = conversations.find(c => c.lead_id === leadIdParam);
      if (targetConversation) {
        navigate(`/messages/${targetConversation.id}`, { replace: true });
      }
      // Silent fail - don't show toast for missing conversation on direct navigation
    }
  }, [leadIdParam, conversations, loading]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Fetch conversations where user is either homeowner or handwerker
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          *,
          lead:leads(title, status)
        `)
        .or(`homeowner_id.eq.${user.id},handwerker_id.eq.${user.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (conversationsError) throw conversationsError;

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Collect all unique user IDs and conversation IDs
      const userIds = new Set<string>();
      const conversationIds: string[] = [];
      conversationsData.forEach(conv => {
        userIds.add(conv.homeowner_id);
        userIds.add(conv.handwerker_id);
        conversationIds.push(conv.id);
      });

      // Batch fetch all profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', Array.from(userIds));

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      // Batch fetch latest messages for all conversations
      // Using a single query with window functions would be ideal, but we can optimize with Promise.all
      const [messagesResult, unreadResult] = await Promise.all([
        // Get all messages for these conversations, ordered by created_at desc
        supabase
          .from('messages')
          .select('conversation_id, content, created_at, sender_id')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false }),
        
        // Get unread counts in one query
        supabase
          .from('messages')
          .select('conversation_id', { count: 'exact' })
          .in('conversation_id', conversationIds)
          .eq('recipient_id', user.id)
          .is('read_at', null)
      ]);

      // Group messages by conversation and get latest
      const latestMessagesMap = new Map<string, { content: string; created_at: string; sender_id: string }>();
      (messagesResult.data || []).forEach(msg => {
        if (!latestMessagesMap.has(msg.conversation_id)) {
          latestMessagesMap.set(msg.conversation_id, msg);
        }
      });

      // Count unread per conversation
      const unreadCountMap = new Map<string, number>();
      if (unreadResult.data) {
        unreadResult.data.forEach(msg => {
          const count = unreadCountMap.get(msg.conversation_id) || 0;
          unreadCountMap.set(msg.conversation_id, count + 1);
        });
      }

      // Build final conversations list
      const conversationsWithMessages = conversationsData.map(conversation => ({
        ...conversation,
        homeowner: profilesMap.get(conversation.homeowner_id) || { full_name: 'Kunde', avatar_url: null },
        handwerker: profilesMap.get(conversation.handwerker_id) || { full_name: 'Handwerker', avatar_url: null },
        latest_message: latestMessagesMap.get(conversation.id) || null,
        unread_count: unreadCountMap.get(conversation.id) || 0,
      }));

      setConversations(conversationsWithMessages as any);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // Silent fail on initial load
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (conversation: ConversationListItem) => {
    return user?.id === conversation.homeowner_id 
      ? conversation.handwerker 
      : conversation.homeowner;
  };

  const formatConversationTime = (dateString: string) => {
    const diffInHours = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return formatTimeSwiss(dateString);
    } else if (diffInHours < 168) {
      return formatTimeAgo(dateString);
    } else {
      return formatTimeSwiss(dateString);
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
        <main className="container mx-auto px-4 py-8 pt-24">
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
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Nachrichten</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Ihre Unterhaltungen mit Handwerkern und Auftraggebern
              </p>
            </div>
            <Button 
              size="sm"
              className="self-start sm:self-auto"
              onClick={() => {
                const hasHandwerkerConversations = conversations.some(
                  c => c.handwerker_id === user?.id
                );
                navigate(hasHandwerkerConversations ? '/handwerker-dashboard' : '/dashboard');
              }}
            >
              Zurück
            </Button>
          </div>

          {conversations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Unterhaltungen</h3>
                <p className="text-muted-foreground mb-4">
                  {isHandwerker 
                    ? 'Sie haben noch keine Nachrichten. Durchsuchen Sie verfügbare Aufträge und reichen Sie Offerten ein.'
                    : 'Sie haben noch keine Nachrichten. Erstellen Sie einen Auftrag, um Offerten von Handwerkern zu erhalten.'}
                </p>
                <Button onClick={() => navigate(isHandwerker ? '/browse-leads' : '/submit-lead')}>
                  {isHandwerker ? 'Aufträge durchsuchen' : 'Auftrag erstellen'}
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
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
                          <AvatarImage src={otherUser.avatar_url} />
                          <AvatarFallback>
                            <User className="h-5 w-5 sm:h-6 sm:w-6" />
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start sm:items-center justify-between gap-2 mb-1">
                            <h3 className={`font-semibold truncate text-sm sm:text-base ${
                              hasUnread ? 'text-primary' : ''
                            }`}>
                              {otherUser.full_name || 'Benutzer'}
                            </h3>
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              {hasUnread && (
                                <Badge variant="default" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                              <Badge 
                                variant={conversation.lead.status === 'active' ? 'default' : 'secondary'}
                                className="text-xs hidden sm:inline-flex"
                              >
                                {conversation.lead.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 truncate">
                            {conversation.lead.title}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            {conversation.latest_message ? (
                              <p className={`text-xs sm:text-sm truncate flex-1 ${
                                hasUnread ? 'font-medium' : 'text-muted-foreground'
                              }`}>
                                {conversation.latest_message.sender_id === user?.id ? 'Sie: ' : ''}
                                {truncateMessage(conversation.latest_message.content, 40)}
                              </p>
                            ) : (
                              <p className="text-xs sm:text-sm text-muted-foreground italic">
                                Noch keine Nachrichten
                              </p>
                            )}
                            {conversation.latest_message && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                                <Clock className="h-3 w-3" />
                                {formatConversationTime(conversation.latest_message.created_at)}
                              </span>
                            )}
                          </div>
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