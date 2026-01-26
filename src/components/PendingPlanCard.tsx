import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Clock, CreditCard, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SUBSCRIPTION_PLANS, type SubscriptionPlanType, formatPrice, formatPricePerMonth } from '@/config/subscriptionPlans';

interface PendingPlanCardProps {
  pendingPlan: SubscriptionPlanType;
  isApproved: boolean;
  userId: string;
  onPlanCancelled: () => void;
}

export const PendingPlanCard: React.FC<PendingPlanCardProps> = ({
  pendingPlan,
  isApproved,
  userId,
  onPlanCancelled,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = React.useState(false);

  const plan = SUBSCRIPTION_PLANS[pendingPlan];

  const handlePayNow = () => {
    navigate(`/checkout?plan=${pendingPlan}`);
  };

  const handleCancelPendingPlan = async () => {
    setIsCancelling(true);
    try {
      const { error } = await supabase
        .from('handwerker_subscriptions')
        .update({ pending_plan: null })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Plan storniert',
        description: 'Sie bleiben auf dem kostenlosen Plan. Sie können jederzeit upgraden.',
      });

      onPlanCancelled();
    } catch (error) {
      console.error('Error cancelling pending plan:', error);
      toast({
        title: 'Fehler',
        description: 'Plan konnte nicht storniert werden.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Geplantes Upgrade
          </CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Ausstehend
          </Badge>
        </div>
        <CardDescription>
          {isApproved 
            ? 'Ihr Profil wurde freigeschaltet. Schliessen Sie jetzt Ihr Abonnement ab.'
            : 'Ihr Profil wird noch geprüft. Nach der Freischaltung erhalten Sie einen Zahlungslink per E-Mail.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-background rounded-lg p-4 border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-lg">{plan.displayName}</span>
            <span className="text-xl font-bold text-primary">{formatPrice(plan.price)}</span>
          </div>
          <p className="text-sm text-muted-foreground">{formatPricePerMonth(plan)}</p>
          {plan.savings && (
            <Badge variant="secondary" className="mt-2 text-green-600 bg-green-100">
              {plan.savings}
            </Badge>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isApproved && (
            <Button 
              onClick={handlePayNow} 
              className="flex-1"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Jetzt bezahlen
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleCancelPendingPlan}
            disabled={isCancelling}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            {isCancelling ? 'Wird storniert...' : 'Stornieren (kostenlos bleiben)'}
          </Button>
        </div>

        {!isApproved && (
          <p className="text-xs text-muted-foreground text-center">
            Sie können Ihren Plan jederzeit stornieren, solange Sie noch nicht bezahlt haben.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
