/**
 * Single Source of Truth for Proposal Status Badge
 * Use this component for consistent status display across the app
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

interface ProposalStatusBadgeProps {
  status: string;
  showIcon?: boolean;
}

export const ProposalStatusBadge: React.FC<ProposalStatusBadgeProps> = ({ 
  status, 
  showIcon = true 
}) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          {showIcon && <Clock className="h-3 w-3" />}
          Ausstehend
        </Badge>
      );
    case 'accepted':
      return (
        <Badge variant="default" className="flex items-center gap-1 bg-green-600">
          {showIcon && <CheckCircle className="h-3 w-3" />}
          Angenommen
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          {showIcon && <XCircle className="h-3 w-3" />}
          Abgelehnt
        </Badge>
      );
    case 'withdrawn':
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          Zurückgezogen
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
