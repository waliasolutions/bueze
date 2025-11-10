import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProposalLimitBadgeProps {
  userId: string;
}

export const ProposalLimitBadge: React.FC<ProposalLimitBadgeProps> = ({ userId }) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscription();
  }, [userId]);

  const fetchSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('handwerker_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      setSubscription(data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const isUnlimited = subscription?.proposals_limit === -1;
  const remaining = isUnlimited 
    ? Infinity 
    : (subscription?.proposals_limit || 5) - (subscription?.proposals_used_this_period || 0);
  
  const isLow = !isUnlimited && remaining <= 2 && remaining > 0;
  const isDepleted = !isUnlimited && remaining <= 0;

  if (isUnlimited) {
    return (
      <Badge variant="outline" className="gap-1.5 bg-primary/10 text-primary border-primary/20">
        <Check className="h-3 w-3" />
        Unbegrenzte Offerten
      </Badge>
    );
  }

  if (isDepleted) {
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

  if (isLow) {
    return (
      <Badge 
        variant="outline" 
        className="gap-1.5 bg-orange-500/10 text-orange-600 border-orange-500/20 cursor-pointer"
        onClick={() => navigate('/checkout')}
      >
        <AlertCircle className="h-3 w-3" />
        {remaining} Offerten übrig
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1.5">
      {remaining} von {subscription?.proposals_limit || 5} Offerten übrig
    </Badge>
  );
};
