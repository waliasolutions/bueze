import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface HandwerkerNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  related_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export function HandwerkerNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<HandwerkerNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    
    // Set up realtime subscription for handwerker notifications
    // Using client_notifications table since it's already set up for user-specific notifications
    const channel = supabase
      .channel('handwerker-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'client_notifications'
        },
        (payload) => {
          // Check if this notification is for the current user
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && payload.new.user_id === user.id) {
              const newNotification = payload.new as HandwerkerNotification;
              setNotifications(prev => [newNotification, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Use client_notifications table for handwerker notifications too
      // This table is generic enough for all user types
      const { data, error } = await supabase
        .from('client_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const mapped = (data || []).map(n => ({
        ...n,
        metadata: n.metadata as Record<string, unknown> | null
      }));
      
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching handwerker notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('client_notifications')
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('client_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: HandwerkerNotification) => {
    markAsRead(notification.id);
    
    const metadata = notification.metadata || {};
    switch (notification.type) {
      case 'new_lead':
        navigate('/handwerker-dashboard');
        break;
      case 'proposal_accepted':
        if (metadata.conversation_id) {
          navigate(`/messages/${metadata.conversation_id}`);
        } else if (metadata.lead_id) {
          navigate(`/lead-details/${metadata.lead_id}`);
        } else {
          navigate('/handwerker-dashboard');
        }
        break;
      case 'proposal_rejected':
        navigate('/handwerker-dashboard');
        break;
      case 'message_received':
        if (metadata.conversation_id) {
          navigate(`/messages/${metadata.conversation_id}`);
        } else {
          navigate('/conversations');
        }
        break;
      case 'new_review':
        navigate('/handwerker-dashboard?tab=reviews');
        break;
      default:
        navigate('/handwerker-dashboard');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_lead':
        return '📋';
      case 'proposal_accepted':
        return '✅';
      case 'proposal_rejected':
        return '❌';
      case 'message_received':
        return '💬';
      case 'new_review':
        return '⭐';
      default:
        return '🔔';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Benachrichtigungen</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              onClick={(e) => {
                e.preventDefault();
                markAllAsRead();
              }}
            >
              Alle als gelesen markieren
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Laden...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Keine Benachrichtigungen
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex items-start gap-3 p-3 cursor-pointer ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="text-lg flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), {
                      addSuffix: true,
                      locale: de
                    })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
