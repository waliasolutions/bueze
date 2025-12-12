import { useNavigate } from 'react-router-dom';
import { NotificationDropdown, BaseNotification } from '@/components/ui/notification-dropdown';

interface AdminNotification extends BaseNotification {
  // Admin notifications don't have user_id - they're global
}

export const AdminNotifications = () => {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: AdminNotification) => {
    // Navigate based on notification type
    switch (notification.type) {
      case 'new_handwerker_registration':
        if (notification.related_id) {
          navigate(`/admin/handwerker?highlight=${notification.related_id}`);
        } else {
          navigate('/admin/handwerker');
        }
        break;
      case 'new_lead':
        navigate('/admin/leads');
        break;
      case 'new_review':
        navigate('/admin/reviews');
        break;
      default:
        navigate('/admin/dashboard');
    }
  };

  return (
    <NotificationDropdown<AdminNotification>
      tableName="admin_notifications"
      channelName="admin-notifications"
      onNotificationClick={handleNotificationClick}
    />
  );
};
