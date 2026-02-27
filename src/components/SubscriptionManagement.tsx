import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Calendar, AlertTriangle, Infinity as InfinityIcon } from 'lucide-react';
import { formatDate } from '@/lib/swissTime';
import { PendingPlanCard } from '@/components/PendingPlanCard';
import { 
  SUBSCRIPTION_PLAN_LIST,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type SubscriptionPlanType,
  formatPrice,
  formatPricePerMonth 
} from '@/config/subscriptionPlans';

interface CurrentSubscription {
  plan: SubscriptionPlan;
  isActive: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usedProposals: number;
  hasPaymentMethod: boolean;
  pendingPlan?: SubscriptionPlanType | null;
  userId?: string;
  isApproved?: boolean;
}

interface SubscriptionManagementProps {
  currentSubscription: CurrentSubscription | null;
  availablePlans?: SubscriptionPlan[];
  onUpgradePlan: (planId: SubscriptionPlanType) => void;
  onCancelSubscription: () => void;
  onPendingPlanCancelled?: () => void;
  loading?: boolean;
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  currentSubscription,
  onUpgradePlan,
  onCancelSubscription,
  onPendingPlanCancelled,
  loading = false
}) => {
  const getUsagePercentage = () => {
    if (!currentSubscription || currentSubscription.plan.proposalsLimit === -1) return 0;
    return (currentSubscription.usedProposals / currentSubscription.plan.proposalsLimit) * 100;
  };

  const getRemainingProposals = () => {
    if (!currentSubscription || currentSubscription.plan.proposalsLimit === -1) return Infinity;
    return Math.max(0, currentSubscription.plan.proposalsLimit - currentSubscription.usedProposals);
  };

  // Get paid plans only (exclude free)
  const paidPlans = SUBSCRIPTION_PLAN_LIST.filter(p => p.id !== 'free');

  if (!currentSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Abonnement wählen
          </CardTitle>
          <CardDescription>
            Wählen Sie ein Abonnement, um unbegrenzt Offerten einzureichen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {paidPlans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{plan.displayName}</h3>
                  {plan.popular && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                      Beliebt
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{formatPrice(plan.price)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatPricePerMonth(plan)}
                  </p>
                  {plan.savings && (
                    <p className="text-sm text-green-600 font-medium">
                      {plan.savings}
                    </p>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => onUpgradePlan(plan.id)}
                  disabled={loading}
                >
                  Jetzt wählen
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUnlimited = currentSubscription.plan.proposalsLimit === -1;
  const remainingProposals = getRemainingProposals();

  return (
    <div className="space-y-6">
      {/* Pending Plan Card */}
      {currentSubscription.pendingPlan && currentSubscription.userId && (
        <PendingPlanCard
          pendingPlan={currentSubscription.pendingPlan}
          isApproved={currentSubscription.isApproved ?? false}
          userId={currentSubscription.userId}
          onPlanCancelled={onPendingPlanCancelled || (() => {})}
        />
      )}

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Aktuelles Abonnement
          </CardTitle>
          <CardDescription>
            Verwalten Sie Ihr {currentSubscription.plan.displayName} Abonnement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!currentSubscription.hasPaymentMethod && (
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Zahlungsmethode erforderlich</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Fügen Sie eine Zahlungsmethode hinzu, um Ihr Abonnement zu aktivieren.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="text-center p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-lg">Plan</h4>
              <p className="text-2xl font-bold text-primary">{currentSubscription.plan.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {formatPricePerMonth(currentSubscription.plan)}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-lg">Offerten-Limit</h4>
              <p className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                {isUnlimited ? (
                  <>
                    <InfinityIcon className="h-6 w-6" />
                    <span>Unbegrenzt</span>
                  </>
                ) : (
                  currentSubscription.plan.proposalsLimit
                )}
              </p>
              <p className="text-sm text-muted-foreground">pro Monat</p>
            </div>
          </div>

          {!isUnlimited && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Offerten-Verbrauch diesen Monat</span>
                <span>{currentSubscription.usedProposals} von {currentSubscription.plan.proposalsLimit}</span>
              </div>
              <Progress value={getUsagePercentage()} className="h-2" />
              <p className="text-sm text-muted-foreground">
                {remainingProposals} Offerten verbleibend bis {formatDate(currentSubscription.currentPeriodEnd)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Nächste Abrechnung: {formatDate(currentSubscription.currentPeriodEnd)}
            </span>
          </div>

          {currentSubscription.plan.id !== 'free' && (
            <div className="pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={onCancelSubscription}
              >
                Abo kündigen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {currentSubscription.plan.id === 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade zu unbegrenzten Offerten</CardTitle>
            <CardDescription>
              Reichen Sie unbegrenzt Offerten ein und wachsen Sie Ihr Geschäft
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {paidPlans.map((plan) => (
                <div key={plan.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">{plan.displayName}</h3>
                    {plan.popular && (
                      <Badge variant="secondary">Beliebt</Badge>
                    )}
                  </div>
                  <p className="text-2xl font-bold mb-1">{formatPrice(plan.price)}</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {formatPrice(plan.pricePerMonth)}/Monat
                  </p>
                  {plan.savings && (
                    <p className="text-xs text-green-600 mb-3">{plan.savings}</p>
                  )}
                  <Button 
                    onClick={() => onUpgradePlan(plan.id)}
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="sm"
                  >
                    Jetzt upgraden
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};