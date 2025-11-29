import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProposalLimitBadgeProps {
  userId: string;
}

export const ProposalLimitBadge: React.FC<ProposalLimitBadgeProps> = ({ userId }) => {
  const { subscription, loading } = useSubscription({ userId });
  const navigate = useNavigate();

  if (loading) return null;
  if (!subscription) return null;

  if (subscription.isUnlimited) {
    return (
      <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
        <Check className="h-3 w-3" />
        Unbegrenzte Offerten
      </Badge>
    );
  }

  if (subscription.isDepleted) {
    return (
      <Badge 
        variant="outline" 
        className="gap-1.5 bg-destructive/10 text-destructive border-destructive/20 cursor-pointer"
        onClick={() => navigate('/checkout')}
      >
        <AlertCircle className="h-3 w-3" />
        Limit erreicht - Jetzt upgraden
      </Badge>
    );
  }

  if (subscription.isLow) {
    return (
      <Badge 
        variant="outline" 
        className="gap-1.5 bg-orange-500/10 text-orange-600 border-orange-500/20 cursor-pointer"
        onClick={() => navigate('/checkout')}
      >
        <AlertCircle className="h-3 w-3" />
        {subscription.remainingProposals} Offerten übrig
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5">
      {subscription.remainingProposals} von {subscription.proposalsLimit} Offerten übrig
    </Badge>
  );
};
