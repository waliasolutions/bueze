import React, { useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';

interface SubscriptionManagerProps {
  userId: string;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ userId }) => {
  const { subscription, loading, refetch } = useSubscription({ userId });
  const navigate = useNavigate();

  useEffect(() => {
    refetch();
    
    // Cleanup: no async operations to cancel, but ensures consistent pattern
    return () => {
      // Any pending async operations from refetch will be ignored on unmount
    };
  }, [userId, refetch]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-48 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
        <div className="h-64 bg-[hsl(var(--muted))] rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!subscription) return null;

  const plan = SUBSCRIPTION_PLANS[subscription.plan];

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className={subscription.plan === 'free' ? 'border-[hsl(var(--border))]' : 'border-[hsl(var(--brand-500))] bg-[hsl(var(--pastel-blue-50))]'}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                {subscription.plan !== 'free' && (
                  <Badge className="bg-[hsl(var(--brand-500))]">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
              <CardDescription className="text-base">
                {subscription.plan === 'free' 
                  ? 'Kostenlos · Beschränktes Kontingent'
                  : `CHF ${plan.price} / ${plan.billingCycle === 'monthly' ? 'Monat' : plan.billingCycle === '6_month' ? '6 Monate' : 'Jahr'}`
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quota Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Offerten-Kontingent</span>
              <span className="text-sm font-bold">
                {subscription.isUnlimited 
                  ? 'Unbegrenzt' 
                  : `${subscription.usedProposals} / ${plan.proposalsLimit}`
                }
              </span>
            </div>
            {!subscription.isUnlimited && (
              <>
                <Progress value={subscription.usagePercentage} className="h-3 mb-2" />
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Noch {subscription.remainingProposals} Offerte{subscription.remainingProposals !== 1 ? 'n' : ''} verfügbar · 
                  Zurücksetzen in {subscription.daysUntilReset} Tag{subscription.daysUntilReset !== 1 ? 'en' : ''}
                </p>
              </>
            )}
          </div>

          {/* Low Quota Warning */}
          {subscription.isLow && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-900 mb-1">Kontingent fast aufgebraucht</h4>
                <p className="text-sm text-amber-800">
                  Sie haben nur noch {subscription.remainingProposals} Offerte{subscription.remainingProposals !== 1 ? 'n' : ''} übrig. 
                  Upgraden Sie jetzt für unbegrenzte Offerten.
                </p>
              </div>
            </div>
          )}

          {/* Zero Quota Warning */}
          {subscription.isDepleted && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">Kontingent erschöpft</h4>
                <p className="text-sm text-red-800">
                  Sie haben Ihr monatliches Limit erreicht. Upgraden Sie für unbegrenzte Offerten oder warten Sie {subscription.daysUntilReset} Tag{subscription.daysUntilReset !== 1 ? 'e' : ''} bis zur Zurücksetzung.
                </p>
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="pt-4 border-t border-[hsl(var(--border))]">
            <h4 className="font-semibold mb-3">Enthaltene Leistungen</h4>
            <ul className="space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Upgrade CTA */}
          {subscription.plan === 'free' && (
            <Button 
              onClick={() => navigate('/checkout')} 
              className="w-full bg-[hsl(var(--brand-500))] hover:bg-[hsl(var(--brand-600))]"
              size="lg"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Jetzt upgraden
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Available Plans (if on free plan) */}
      {subscription.plan === 'free' && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Upgrade Optionen</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.values(SUBSCRIPTION_PLANS)
              .filter(p => p.id !== 'free')
              .map((planOption) => (
                <Card 
                  key={planOption.id}
                  className={planOption.popular ? 'border-[hsl(var(--brand-500))] shadow-lg' : ''}
                >
                  <CardHeader>
                    {planOption.popular && (
                      <Badge className="w-fit mb-2 bg-[hsl(var(--brand-500))]">
                        <Zap className="h-3 w-3 mr-1" />
                        Beliebt
                      </Badge>
                    )}
                    <CardTitle className="text-lg">{planOption.displayName}</CardTitle>
                    <CardDescription>
                      <div className="text-2xl font-bold text-[hsl(var(--foreground))] mt-2">
                        CHF {planOption.pricePerMonth}
                      </div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        pro Monat
                      </div>
                      {planOption.savings && (
                        <div className="text-xs text-green-600 font-semibold mt-1">
                          {planOption.savings}
                        </div>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {planOption.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => navigate('/checkout?plan=' + planOption.id)}
                      variant={planOption.popular ? 'default' : 'outline'}
                      className="w-full"
                    >
                      Auswählen
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
