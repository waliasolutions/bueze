import { useState, useEffect, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ['notifications', tableName, userId ?? 'all'] as const;

  const { data: notifications = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async (): Promise<T[]> => {
      // All three notification tables share identical schemas, so we cast
      // to avoid Supabase's per-table type narrowing while keeping a single query
      let query = (supabase.from(tableName as any) as any)
        .select('id, type, title, message, read, related_id, metadata, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      // Admin notifications are global; client/handwerker filter by user
      if (tableName !== 'admin_notifications' && userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((n: any) => ({
        ...n,
        metadata: n.metadata as Record<string, unknown> | null,
      })) as T[];
    },
    // Cached across route changes / remounts; realtime keeps it fresh
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: tableName === 'admin_notifications' || Boolean(userId),
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const setNotifications = (updater: (prev: T[]) => T[]) => {
    queryClient.setQueryData<T[]>(queryKey, (prev) => updater(prev ?? []));
  };

  useEffect(() => {
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
        (payload) => {
          const newNotification = payload.new as T;

          // For user-specific tables, verify the notification belongs to this user
          if (userId && tableName !== 'admin_notifications') {
            if ((newNotification as any).user_id !== userId) return;
          }

          // Patch the cache instead of refetching the whole list
          setNotifications((prev) => [newNotification, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelName, tableName, userId]);

  const markAsRead = async (notificationId: string) => {
    try {
      await (supabase.from(tableName as any) as any)
        .update({ read: true })
        .eq('id', notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      if (unreadIds.length === 0) return;

      await (supabase.from(tableName as any) as any)
        .update({ read: true })
        .in('id', unreadIds);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
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
