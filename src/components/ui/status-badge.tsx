/**
 * Generic Status Badge - Single Source of Truth for status displays
 * Extends the pattern from ProposalStatusBadge for other entity statuses
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Pause,
  FileText,
  Send,
  Eye,
  LucideIcon
} from 'lucide-react';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface StatusConfig {
  label: string;
  variant: BadgeVariant;
  icon?: LucideIcon;
  className?: string;
}

// =============================================================================
// Lead Status Badge
// =============================================================================
const leadStatusConfig: Record<string, StatusConfig> = {
  draft: { label: 'Entwurf', variant: 'outline', icon: FileText },
  active: { label: 'Aktiv', variant: 'default', icon: Eye, className: 'bg-green-600' },
  closed: { label: 'Abgeschlossen', variant: 'secondary', icon: CheckCircle },
  cancelled: { label: 'Abgebrochen', variant: 'destructive', icon: XCircle },
  paused: { label: 'Pausiert', variant: 'outline', icon: Pause },
  completed: { label: 'Erledigt', variant: 'default', icon: CheckCircle, className: 'bg-green-600' },
  deleted: { label: 'Gelöscht', variant: 'destructive', icon: XCircle },
};

export const LeadStatusBadge: React.FC<{ status: string; showIcon?: boolean }> = ({
  status,
  showIcon = true,
}) => {
  const config = leadStatusConfig[status] || { label: status, variant: 'outline' as const };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ''}`}>
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

// =============================================================================
// Verification Status Badge
// =============================================================================
const verificationStatusConfig: Record<string, StatusConfig> = {
  pending: { label: 'Ausstehend', variant: 'secondary', icon: Clock },
  approved: { label: 'Geprüft', variant: 'default', icon: CheckCircle, className: 'bg-green-600' },
  rejected: { label: 'Abgelehnt', variant: 'destructive', icon: XCircle },
  needs_review: { label: 'Überprüfung nötig', variant: 'outline', icon: AlertCircle, className: 'border-amber-500 text-amber-600' },
};

export const VerificationStatusBadge: React.FC<{ status: string; showIcon?: boolean }> = ({
  status,
  showIcon = true,
}) => {
  const config = verificationStatusConfig[status] || { label: status, variant: 'outline' as const };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ''}`}>
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

// =============================================================================
// Subscription Status Badge
// =============================================================================
const subscriptionStatusConfig: Record<string, StatusConfig> = {
  active: { label: 'Aktiv', variant: 'default', icon: CheckCircle, className: 'bg-green-600' },
  inactive: { label: 'Inaktiv', variant: 'secondary' },
  cancelled: { label: 'Gekündigt', variant: 'outline' },
  past_due: { label: 'Zahlung fällig', variant: 'destructive', icon: AlertCircle },
  trialing: { label: 'Testphase', variant: 'outline', icon: Clock },
};

export const SubscriptionStatusBadge: React.FC<{ status: string; showIcon?: boolean }> = ({
  status,
  showIcon = true,
}) => {
  const config = subscriptionStatusConfig[status] || { label: status, variant: 'outline' as const };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ''}`}>
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

// =============================================================================
// Urgency Badge
// =============================================================================
const urgencyConfig: Record<string, StatusConfig> = {
  today: { label: 'Heute', variant: 'destructive', icon: AlertCircle },
  this_week: { label: 'Diese Woche', variant: 'default', icon: Clock, className: 'bg-amber-500' },
  this_month: { label: 'Diesen Monat', variant: 'secondary' },
  planning: { label: 'In Planung', variant: 'outline' },
};

export const UrgencyBadge: React.FC<{ urgency: string; showIcon?: boolean }> = ({
  urgency,
  showIcon = true,
}) => {
  const config = urgencyConfig[urgency] || { label: urgency, variant: 'outline' as const };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`flex items-center gap-1 ${config.className || ''}`}>
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </Badge>
  );
};

// =============================================================================
// Generic Configurable Status Badge
// =============================================================================
interface GenericStatusBadgeProps {
  status: string;
  config: Record<string, StatusConfig>;
  showIcon?: boolean;
  className?: string;
}

export const GenericStatusBadge: React.FC<GenericStatusBadgeProps> = ({
  status,
  config,
  showIcon = true,
  className = '',
}) => {
  const statusConfig = config[status] || { label: status, variant: 'outline' as const };
  const Icon = statusConfig.icon;

  return (
    <Badge 
      variant={statusConfig.variant} 
      className={`flex items-center gap-1 ${statusConfig.className || ''} ${className}`}
    >
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {statusConfig.label}
    </Badge>
  );
};
