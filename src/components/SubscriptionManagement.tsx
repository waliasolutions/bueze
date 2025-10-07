import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Users, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatDate } from '@/lib/swissTime';

interface SubscriptionPlan {
  id: string;
  name: 'starter' | 'professional';
  displayName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  competitors: number;
  includedLeads: number;
  extraLeadPrice: number;
  features: string[];
}

interface CurrentSubscription {
  plan: SubscriptionPlan;
  isActive: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usedLeads: number;
  isYearly: boolean;
  hasPaymentMethod: boolean;
}

interface SubscriptionManagementProps {
  currentSubscription: CurrentSubscription | null;
  availablePlans: SubscriptionPlan[];
  onUpgradePlan: (planId: string, yearly: boolean) => void;
  onCancelSubscription: () => void;
  loading?: boolean;
}

const plans: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'starter',
    displayName: 'Starter',
    monthlyPrice: 49,
    yearlyPrice: 490,
    competitors: 4,
    includedLeads: 10,
    extraLeadPrice: 20,
    features: [
      '10 Leads pro Monat inklusive',
      '4 Konkurrenten pro Lead',
      'Standard Lead-Qualität',
      'E-Mail Support',
      'Basis-Dashboard'
    ]
  },
  {
    id: 'professional',
    name: 'professional',
    displayName: 'Professional',
    monthlyPrice: 99,
    yearlyPrice: 990,
    competitors: 2,
    includedLeads: 25,
    extraLeadPrice: 15,
    features: [
      '25 Leads pro Monat inklusive',
      'Nur 2 Konkurrenten pro Lead',
      'Premium Lead-Qualität',
      'Prioritäts-Support',
      'Erweiterte Analytics',
      'Lead-Vorschau verfügbar'
    ]
  }
];

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({
  currentSubscription,
  onUpgradePlan,
  onCancelSubscription,
  loading = false
}) => {
  const getUsagePercentage = () => {
    if (!currentSubscription) return 0;
    return (currentSubscription.usedLeads / currentSubscription.plan.includedLeads) * 100;
  };

  const getRemainingLeads = () => {
    if (!currentSubscription) return 0;
    return Math.max(0, currentSubscription.plan.includedLeads - currentSubscription.usedLeads);
  };

  if (!currentSubscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Abonnement wählen
          </CardTitle>
          <CardDescription>
            Wählen Sie ein Abonnement, um Leads zu kaufen und zu verwalten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((plan) => (
              <div key={plan.id} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{plan.displayName}</h3>
                  {plan.name === 'professional' && (
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600">
                      Beliebt
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">CHF {plan.monthlyPrice}</span>
                    <span className="text-muted-foreground">/Monat</span>
                  </div>
                  <p className="text-sm text-green-600">
                    Jährlich: CHF {plan.yearlyPrice} (2 Monate gratis)
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.competitors} Konkurrenten pro Lead</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.includedLeads} Leads pro Monat inklusive</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Extra Leads: CHF {plan.extraLeadPrice} pro Lead
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  <Button 
                    className="w-full" 
                    variant={plan.name === 'professional' ? 'default' : 'outline'}
                    onClick={() => onUpgradePlan(plan.id, false)}
                    disabled={loading}
                  >
                    Monatlich wählen
                  </Button>
                  <Button 
                    className="w-full" 
                    variant="secondary"
                    onClick={() => onUpgradePlan(plan.id, true)}
                    disabled={loading}
                  >
                    Jährlich wählen (2 Monate gratis)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
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
                Fügen Sie eine Zahlungsmethode hinzu, um Leads kaufen zu können.
              </p>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-lg">Plan</h4>
              <p className="text-2xl font-bold text-primary">{currentSubscription.plan.displayName}</p>
              <p className="text-sm text-muted-foreground">
                {currentSubscription.isYearly ? 'Jährlich' : 'Monatlich'}
              </p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-lg">Konkurrenten</h4>
              <p className="text-2xl font-bold text-primary">{currentSubscription.plan.competitors}</p>
              <p className="text-sm text-muted-foreground">pro Lead</p>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-lg">Preis</h4>
              <p className="text-2xl font-bold text-primary">
                CHF {currentSubscription.isYearly 
                  ? currentSubscription.plan.yearlyPrice 
                  : currentSubscription.plan.monthlyPrice}
              </p>
              <p className="text-sm text-muted-foreground">
                {currentSubscription.isYearly ? '/Jahr' : '/Monat'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Lead-Verbrauch diesen Monat</span>
              <span>{currentSubscription.usedLeads} von {currentSubscription.plan.includedLeads}</span>
            </div>
            <Progress value={getUsagePercentage()} className="h-2" />
            <p className="text-sm text-muted-foreground">
              {getRemainingLeads()} Leads verbleibend bis {formatDate(currentSubscription.currentPeriodEnd)}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Nächste Abrechnung: {formatDate(currentSubscription.currentPeriodEnd)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Options */}
      {currentSubscription.plan.name === 'starter' && (
        <Card>
          <CardHeader>
            <CardTitle>Upgrade auf Professional</CardTitle>
            <CardDescription>
              Erhalten Sie weniger Konkurrenten und mehr inklusive Leads
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-bold mb-2">Professional Plan Vorteile:</h3>
              <ul className="space-y-1 mb-4">
                <li className="text-sm flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  Nur 2 Konkurrenten (statt 4)
                </li>
                <li className="text-sm flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  25 Leads pro Monat (statt 10)
                </li>
                <li className="text-sm flex items-center gap-2">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full" />
                  CHF 15 pro Extra-Lead (statt CHF 20)
                </li>
              </ul>
              <Button 
                onClick={() => onUpgradePlan('professional', currentSubscription.isYearly)}
                className="w-full"
              >
                Jetzt upgraden
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};