import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send, ArrowLeft, User } from 'lucide-react';
import { formatTime, formatDateRelative } from '@/lib/swissTime';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

interface Conversation {
  id: string;
  lead_id: string;
  homeowner_id: string;
  handwerker_id: string;
  created_at: string;
  last_message_at?: string;
  lead: {
    title: string;
    description: string;
  };
  homeowner: {
    full_name: string;
    avatar_url?: string;
  };
  handwerker: {
    full_name: string;
    avatar_url?: string;
  };
}

const Messages = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let cleanupSubscription: (() => void) | undefined;
    
    const initializeData = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        navigate('/auth');
        return;
      }
      
      if (isMounted) {
        setUser(authUser);
      }
      
      if (conversationId && isMounted) {
        // Fetch conversation and messages in parallel
        await Promise.all([
          fetchConversation(authUser),
          fetchMessages(authUser)
        ]);
        
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
          cleanupSubscription = subscribeToMessages();
        }
      }
    };
    
    initializeData();
    
    return () => {
      isMounted = false;
      if (cleanupSubscription) {
        cleanupSubscription();
      }
    };
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async (authUser: any) => {
    if (!conversationId) return;

    try {
      // Step 1: Fetch conversation with lead (valid FK exists)
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select(`
          *,
          lead:leads(title, description)
        `)
        .eq('id', conversationId)
        .single();

      if (convError) throw convError;

      // Step 2: Fetch both user profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', [convData.homeowner_id, convData.handwerker_id]);

      if (profilesError) throw profilesError;

      // Step 3: Build the combined conversation object
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const conversationWithProfiles: Conversation = {
        ...convData,
        homeowner: profilesMap.get(convData.homeowner_id) || { full_name: 'Kunde', avatar_url: undefined },
        handwerker: profilesMap.get(convData.handwerker_id) || { full_name: 'Handwerker', avatar_url: undefined },
      };

      setConversation(conversationWithProfiles);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast({
        title: "Fehler",
        description: "Die Unterhaltung konnte nicht geladen werden.",
        variant: "destructive",
      });
      navigate('/conversations');
    }
  };

  const fetchMessages = async (authUser: any) => {
    if (!conversationId) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Mark unread messages as read (fire and forget)
      if (authUser) {
        supabase
          .from('messages')
          .update({ read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('recipient_id', authUser.id)
          .is('read_at', null)
          .then(() => {});
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !conversation || sending) return;

    setSending(true);
    try {
      const recipientId = user.id === conversation.homeowner_id 
        ? conversation.handwerker_id 
        : conversation.homeowner_id;

      const messageData = {
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: recipientId,
        content: newMessage.trim(),
        lead_id: conversation.lead_id,
      };

      if (import.meta.env.DEV) {
        console.log('Sending message:', messageData);
      }

      const { data: insertedMessage, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();

      if (error) throw error;

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Trigger message notification edge function
      try {
        await supabase.functions.invoke('send-message-notification', {
          body: { messageId: insertedMessage.id }
        });
      } catch (notifError) {
        console.error('Failed to send message notification:', notifError);
        // Don't block message sending if notification fails
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Fehler",
        description: "Die Nachricht konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getOtherUser = () => {
    if (!conversation || !user) return null;
    return user.id === conversation.homeowner_id 
      ? conversation.handwerker 
      : conversation.homeowner;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-96 bg-muted rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 pt-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Unterhaltung nicht gefunden</h1>
            <Button onClick={() => navigate('/dashboard')}>Zurück zum Dashboard</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const otherUser = getOtherUser();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => {
              // Determine navigation based on user's role in conversation
              const isHandwerkerInConversation = user?.id === conversation?.handwerker_id;
              navigate(isHandwerkerInConversation ? '/handwerker-dashboard' : '/dashboard');
            }}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={otherUser?.avatar_url} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold">{otherUser?.full_name || 'Benutzer'}</h1>
                <p className="text-sm text-muted-foreground">{conversation.lead.title}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">{conversation.lead.title}</CardTitle>
              <CardDescription>{conversation.lead.description}</CardDescription>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Noch keine Nachrichten. Schreiben Sie die erste Nachricht!
                  </p>
                ) : (
                  messages.map((message, index) => {
                    const isOwnMessage = message.sender_id === user?.id;
                    const showDate = index === 0 || 
                      formatDateRelative(messages[index - 1]?.created_at) !== formatDateRelative(message.created_at);

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {formatDateRelative(message.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-3 py-2 ${
                              isOwnMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <p className={`text-xs mt-1 ${
                              isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {formatTime(message.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Message Input */}
          <Card>
            <CardContent className="p-4">
              <form onSubmit={sendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nachricht schreiben..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sending || !newMessage.trim()}>
                  {sending ? (
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Messages;