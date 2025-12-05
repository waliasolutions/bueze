/**
 * Empty State - Reusable component for empty/no-data states
 * Single Source of Truth for consistent empty state displays
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  Inbox, 
  Search, 
  Users, 
  MessageSquare, 
  Star,
  LucideIcon 
} from 'lucide-react';

type EmptyStateVariant = 
  | 'default' 
  | 'leads' 
  | 'proposals' 
  | 'messages' 
  | 'reviews' 
  | 'search' 
  | 'users';

interface EmptyStateProps {
  /** Pre-defined variant for common use cases */
  variant?: EmptyStateVariant;
  /** Custom icon (overrides variant icon) */
  icon?: LucideIcon;
  /** Title text */
  title?: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Wrap in Card component */
  asCard?: boolean;
  /** Custom className */
  className?: string;
}

const variantConfig: Record<EmptyStateVariant, { 
  icon: LucideIcon; 
  title: string; 
  description: string;
}> = {
  default: {
    icon: Inbox,
    title: 'Keine Daten vorhanden',
    description: 'Es sind noch keine Einträge vorhanden.',
  },
  leads: {
    icon: FileText,
    title: 'Keine Aufträge gefunden',
    description: 'Es sind momentan keine passenden Aufträge in Ihrer Region verfügbar.',
  },
  proposals: {
    icon: FileText,
    title: 'Keine Angebote vorhanden',
    description: 'Sie haben noch keine Angebote erhalten oder eingereicht.',
  },
  messages: {
    icon: MessageSquare,
    title: 'Keine Nachrichten',
    description: 'Sie haben noch keine Unterhaltungen. Nachrichten werden nach einer Angebotsannahme möglich.',
  },
  reviews: {
    icon: Star,
    title: 'Keine Bewertungen',
    description: 'Sie haben noch keine Bewertungen erhalten.',
  },
  search: {
    icon: Search,
    title: 'Keine Ergebnisse',
    description: 'Ihre Suche ergab keine Treffer. Versuchen Sie andere Suchbegriffe.',
  },
  users: {
    icon: Users,
    title: 'Keine Benutzer',
    description: 'Es wurden keine Benutzer gefunden.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'default',
  icon: CustomIcon,
  title,
  description,
  action,
  secondaryAction,
  asCard = true,
  className = '',
}) => {
  const config = variantConfig[variant];
  const Icon = CustomIcon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  const content = (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{displayTitle}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{displayDescription}</p>
      
      {(action || secondaryAction) && (
        <div className="flex gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (asCard) {
    return (
      <Card>
        <CardContent className="p-0">
          {content}
        </CardContent>
      </Card>
    );
  }

  return content;
};

/**
 * Inline Empty State - Smaller version for inline use
 */
export const InlineEmptyState: React.FC<{
  message: string;
  icon?: LucideIcon;
  className?: string;
}> = ({ message, icon: Icon = Inbox, className = '' }) => {
  return (
    <div className={`flex items-center gap-3 py-4 text-muted-foreground ${className}`}>
      <Icon className="h-5 w-5" />
      <span className="text-sm">{message}</span>
    </div>
  );
};
