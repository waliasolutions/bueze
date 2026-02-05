import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Shield, CheckCircle } from 'lucide-react';

interface VerifiedSwissBadgeProps {
  isVerified?: boolean;
  zefixVerified?: boolean;
  uid?: string | null;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

/**
 * Verified Swiss Company Badge - SSOT component for displaying verification status
 * Used across: HandwerkerProfileModal, ReceivedProposals, ProposalComparisonDialog
 */
export function VerifiedSwissBadge({ 
  isVerified, 
  zefixVerified, 
  uid, 
  size = 'sm',
  showLabel = true 
}: VerifiedSwissBadgeProps) {
  // Don't show if not verified at all
  if (!isVerified && !zefixVerified) return null;

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  
  // Zefix-verified gets special treatment (red Swiss badge)
  if (zefixVerified) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="bg-red-600 hover:bg-red-700 text-white gap-1 cursor-help">
              <Shield className={iconSize} />
              {showLabel && <span>Verifiziert</span>}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium">Geprüfte Schweizer Firma</p>
            <p className="text-xs text-muted-foreground mt-1">
              Eingetragen im Schweizerischen Handelsregister
            </p>
            {uid && (
              <a 
                href={`https://www.zefix.ch/de/search/entity/welcome?searchText=${encodeURIComponent(uid)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline mt-1 block"
              >
                Zefix-Eintrag ansehen →
              </a>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Standard verified badge (platform-verified)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="secondary" className="gap-1 cursor-help">
            <CheckCircle className={iconSize} />
            {showLabel && <span>Geprüft</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Profil von Büeze.ch geprüft</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
