import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCircle, MessageSquare, FileText, Star } from 'lucide-react';
import { NotificationDropdown, BaseNotification } from '@/components/ui/notification-dropdown';
import { supabase } from '@/integrations/supabase/client';

interface HandwerkerNotification extends BaseNotification {
  user_id: string;
}

export function HandwerkerNotifications() {
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

  const handleNotificationClick = (notification: HandwerkerNotification) => {
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
      case 'new_message':
        if (metadata.conversationId) {
          navigate(`/messages/${metadata.conversationId}`);
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

  const getNotificationIcon = (notification: HandwerkerNotification) => {
    switch (notification.type) {
      case 'new_lead':
        return <FileText className="h-4 w-4 text-primary" />;
      case 'proposal_accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'proposal_rejected':
        return <FileText className="h-4 w-4 text-red-500" />;
      case 'new_message':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      case 'new_review':
        return <Star className="h-4 w-4 text-yellow-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (!userId) return null;

  return (
    <NotificationDropdown<HandwerkerNotification>
      tableName="handwerker_notifications"
      channelName="handwerker-notifications"
      userId={userId}
      onNotificationClick={handleNotificationClick}
      renderIcon={getNotificationIcon}
      maxHeight="300px"
    />
  );
}
