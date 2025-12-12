import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationDropdown, BaseNotification } from '@/components/ui/notification-dropdown';
import { supabase } from '@/integrations/supabase/client';

interface ClientNotification extends BaseNotification {
  user_id: string;
}

export function ClientNotifications() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (isMounted && user) {
        setUserId(user.id);
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleNotificationClick = (notification: ClientNotification) => {
    const metadata = notification.metadata || {};
    
    switch (notification.type) {
      case 'new_proposal':
        if (metadata.lead_id) {
          navigate(`/lead-details/${metadata.lead_id}`);
        } else {
          navigate('/dashboard');
        }
        break;
      case 'proposal_accepted':
      case 'message_received':
        if (metadata.conversation_id) {
          navigate(`/messages/${metadata.conversation_id}`);
        } else {
          navigate('/conversations');
        }
        break;
      default:
        navigate('/dashboard');
    }
  };

  const getNotificationIcon = (notification: ClientNotification) => {
    switch (notification.type) {
      case 'new_proposal':
        return '📩';
      case 'proposal_accepted':
        return '✅';
      case 'message_received':
        return '💬';
      default:
        return '🔔';
    }
  };

  if (!userId) return null;

  return (
    <NotificationDropdown<ClientNotification>
      tableName="client_notifications"
      channelName="client-notifications"
      userId={userId}
      onNotificationClick={handleNotificationClick}
      renderIcon={(n) => <span className="text-lg">{getNotificationIcon(n)}</span>}
    />
  );
}
