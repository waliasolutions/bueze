import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HandwerkerStatusIndicatorProps {
  userId: string;
  verificationStatus: string;
  className?: string;
  showLabel?: boolean;
}

type StatusType = 'active' | 'pending' | 'rejected' | 'limited' | 'incomplete';

interface StatusConfig {
  type: StatusType;
  label: string;
  description: string;
  action?: string;
  actionLink?: string;
  dotColor: string;
  icon: React.ReactNode;
}

export const HandwerkerStatusIndicator: React.FC<HandwerkerStatusIndicatorProps> = ({ 
  userId, 
  verificationStatus,
  className,
  showLabel = true
}) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      // Fetch subscription
      const { data: subData, error: subError } = await supabase
        .from('handwerker_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (subError) throw subError;
      setSubscription(subData);

      // Fetch profile to check completeness - use user_id, not id
      const { data: profileData, error: profileError } = await supabase
        .from('handwerker_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // Handle missing profile gracefully
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }
      
      // Check if profile exists and has essential information
      const isComplete = !!(
        profileData?.first_name &&
        profileData?.last_name &&
        profileData?.email &&
        profileData?.phone_number &&
        profileData?.bio &&
        profileData?.service_areas?.length > 0
      );
      
      setProfileComplete(isComplete);
    } catch (error) {
      console.error('Error fetching status data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (): StatusConfig => {
    // Check profile completeness first
    if (!profileComplete) {
      return {
        type: 'incomplete',
        label: 'Profil unvollständig',
        description: 'Ihr Profil ist unvollständig. Bitte ergänzen Sie alle erforderlichen Informationen.',
        action: 'Profil vervollständigen',
        actionLink: '/handwerker-profile/edit',
        dotColor: 'bg-gray-400',
        icon: <AlertCircle className="h-4 w-4 text-gray-600" />
      };
    }

    // Check verification status
    if (verificationStatus === 'rejected') {
      return {
        type: 'rejected',
        label: 'Abgelehnt',
        description: 'Ihr Profil wurde abgelehnt. Bitte kontaktieren Sie den Support für weitere Informationen.',
        action: 'Support kontaktieren',
        actionLink: 'mailto:info@bueeze.ch',
        dotColor: 'bg-destructive',
        icon: <XCircle className="h-4 w-4 text-destructive" />
      };
    }

    if (verificationStatus === 'pending') {
      return {
        type: 'pending',
        label: 'In Prüfung',
        description: 'Ihr Profil wird geprüft. Sie werden per E-Mail benachrichtigt, sobald die Prüfung abgeschlossen ist.',
        dotColor: 'bg-yellow-500',
        icon: <Clock className="h-4 w-4 text-yellow-600" />
      };
    }

    // Check subscription and proposal limits
    const isUnlimited = subscription?.proposals_limit === -1;
    const remaining = isUnlimited 
      ? Infinity 
      : (subscription?.proposals_limit || 5) - (subscription?.proposals_used_this_period || 0);

    const isActive = subscription?.status === 'active';
    
    if (!isActive || (!isUnlimited && remaining <= 0)) {
      return {
        type: 'limited',
        label: 'Limit erreicht',
        description: 'Sie haben Ihr Offerten-Limit erreicht. Upgraden Sie Ihr Abonnement, um mehr Leads zu sehen.',
        action: 'Jetzt upgraden',
        actionLink: '/pricing',
        dotColor: 'bg-gray-400',
        icon: <AlertCircle className="h-4 w-4 text-gray-600" />
      };
    }

    // All good!
    return {
      type: 'active',
      label: 'Aktiv',
      description: 'Ihr Profil ist aktiv und Sie können Leads durchsuchen und Offerten einreichen.',
      dotColor: 'bg-success',
      icon: <CheckCircle className="h-4 w-4 text-success" />
    };
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-2.5 w-2.5 rounded-full bg-gray-300 animate-pulse" />
        {showLabel && <span className="text-sm text-muted-foreground">Lädt...</span>}
      </div>
    );
  }

  const status = getStatus();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-2 cursor-help", className)}>
            <div className="relative">
              <div className={cn("h-2.5 w-2.5 rounded-full", status.dotColor)} />
              {status.type === 'active' && (
                <div className={cn("absolute inset-0 h-2.5 w-2.5 rounded-full animate-ping opacity-75", status.dotColor)} />
              )}
            </div>
            {showLabel && (
              <div className="flex items-center gap-1.5">
                {status.icon}
                <span className="text-sm font-medium">{status.label}</span>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="text-sm">{status.description}</p>
            {status.action && status.actionLink && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (status.actionLink?.startsWith('mailto:')) {
                    window.location.href = status.actionLink;
                  } else {
                    navigate(status.actionLink);
                  }
                }}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium"
              >
                {status.action} →
              </button>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
