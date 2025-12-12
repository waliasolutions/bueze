import { useState, useEffect, ReactNode, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { formatTimeAgo } from '@/lib/swissTime';

/**
 * Base notification interface - SSOT for notification structure
 */
export interface BaseNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  related_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface NotificationDropdownProps<T extends BaseNotification> {
  /** Database table name for notifications */
  tableName: 'admin_notifications' | 'client_notifications' | 'handwerker_notifications';
  /** Supabase channel name for realtime */
  channelName: string;
  /** User ID filter (null for admin notifications which don't filter by user) */
  userId?: string | null;
  /** Handler for notification click - returns navigation path or void */
  onNotificationClick: (notification: T) => void;
  /** Optional custom icon renderer */
  renderIcon?: (notification: T) => ReactNode;
  /** Max height for scroll area */
  maxHeight?: string;
}

/**
 * Reusable notification dropdown component - SSOT for notification UI
 * Used by AdminNotifications, ClientNotifications, HandwerkerNotifications
 */
export function NotificationDropdown<T extends BaseNotification>({
  tableName,
  channelName,
  userId,
  onNotificationClick,
  renderIcon,
  maxHeight = '400px',
}: NotificationDropdownProps<T>) {
  const [notifications, setNotifications] = useState<T[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      // Use explicit any to avoid Supabase type recursion issues
      let data: any[] | null = null;
      let error: any = null;

      if (tableName === 'admin_notifications') {
        const result = await supabase
          .from('admin_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        data = result.data;
        error = result.error;
      } else if (tableName === 'client_notifications' && userId) {
        const result = await supabase
          .from('client_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        data = result.data;
        error = result.error;
      } else if (tableName === 'handwerker_notifications' && userId) {
        const result = await supabase
          .from('handwerker_notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20);
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return;
      }

      const mapped = (data || []).map(n => ({
        ...n,
        metadata: n.metadata as Record<string, unknown> | null
      })) as T[];

      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
    } catch (error) {
      console.error(`Error in fetchNotifications for ${tableName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [tableName, userId]);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isMounted) {
        await fetchNotifications();
      }
    };
    init();

    // Set up realtime subscription
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: tableName,
        },
        async (payload) => {
          if (!isMounted) return;
          
          const newNotification = payload.new as T;
          
          // For user-specific tables, verify the notification belongs to this user
          if (userId && tableName !== 'admin_notifications') {
            if ((newNotification as any).user_id !== userId) return;
          }
          
          setNotifications(prev => [newNotification, ...prev].slice(0, 20));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [channelName, tableName, userId, fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      // Use explicit table references to avoid type issues
      if (tableName === 'admin_notifications') {
        await supabase.from('admin_notifications').update({ read: true }).eq('id', notificationId);
      } else if (tableName === 'client_notifications') {
        await supabase.from('client_notifications').update({ read: true }).eq('id', notificationId);
      } else if (tableName === 'handwerker_notifications') {
        await supabase.from('handwerker_notifications').update({ read: true }).eq('id', notificationId);
      }

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
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      // Use explicit table references
      if (tableName === 'admin_notifications') {
        await supabase.from('admin_notifications').update({ read: true }).in('id', unreadIds);
      } else if (tableName === 'client_notifications') {
        await supabase.from('client_notifications').update({ read: true }).in('id', unreadIds);
      } else if (tableName === 'handwerker_notifications') {
        await supabase.from('handwerker_notifications').update({ read: true }).in('id', unreadIds);
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleClick = (notification: T) => {
    markAsRead(notification.id);
    onNotificationClick(notification);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 z-[120]" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Benachrichtigungen</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Alle gelesen
            </Button>
          )}
        </div>
        <ScrollArea style={{ height: maxHeight }}>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Laden...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Keine Benachrichtigungen
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-muted/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {renderIcon ? (
                      <span className="mt-0.5 flex-shrink-0">
                        {renderIcon(notification)}
                      </span>
                    ) : (
                      <div
                        className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                          !notification.read ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!renderIcon && !notification.read && (
                      <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
