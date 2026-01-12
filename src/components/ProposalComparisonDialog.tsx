import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, XCircle, MapPin, Star, Shield, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparisonProposal {
  id: string;
  handwerker_id: string;
  price_min: number;
  price_max: number;
  estimated_duration_days: number | null;
  message: string;
  status: string;
  handwerkerName: string;
  handwerkerCity: string | null;
  companyName: string | null;
  logoUrl: string | null;
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  hasInsurance?: boolean;
  bio?: string;
}

interface ProposalComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposals: ComparisonProposal[];
  onAccept: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
}

export const ProposalComparisonDialog: React.FC<ProposalComparisonDialogProps> = ({
  open,
  onOpenChange,
  proposals,
  onAccept,
  onReject,
}) => {
  // Find best values for highlighting
  const lowestPrice = Math.min(...proposals.map(p => p.price_min));
  const highestRating = Math.max(...proposals.map(p => p.rating || 0));
  const shortestDuration = Math.min(...proposals.filter(p => p.estimated_duration_days).map(p => p.estimated_duration_days!));

  const metrics = [
    {
      label: 'Bewertung',
      getValue: (p: ComparisonProposal) => (
        <div className="flex items-center gap-1">
          <Star className={cn(
            "h-4 w-4",
            p.rating === highestRating && highestRating > 0 ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          )} />
          <span className={cn(
            "font-medium",
            p.rating === highestRating && highestRating > 0 && "text-yellow-600"
          )}>
            {p.rating?.toFixed(1) || '–'}
          </span>
          {p.reviewCount ? (
            <span className="text-xs text-muted-foreground">({p.reviewCount})</span>
          ) : null}
        </div>
      ),
    },
    {
      label: 'Preis',
      getValue: (p: ComparisonProposal) => (
        <div className={cn(
          "font-semibold",
          p.price_min === lowestPrice && "text-green-600"
        )}>
          CHF {p.price_min.toLocaleString()} - {p.price_max.toLocaleString()}
          {p.price_min === lowestPrice && (
            <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-700">
              Günstigster
            </Badge>
          )}
        </div>
      ),
    },
    {
      label: 'Dauer',
      getValue: (p: ComparisonProposal) => (
        <div className={cn(
          p.estimated_duration_days === shortestDuration && shortestDuration > 0 && "text-blue-600 font-medium"
        )}>
          {p.estimated_duration_days ? `${p.estimated_duration_days} Tage` : '–'}
          {p.estimated_duration_days === shortestDuration && shortestDuration > 0 && (
            <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700">
              Schnellster
            </Badge>
          )}
        </div>
      ),
    },
    {
      label: 'Standort',
      getValue: (p: ComparisonProposal) => (
        <div className="flex items-center gap-1 text-sm">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          {p.handwerkerCity || '–'}
        </div>
      ),
    },
    {
      label: 'Geprüft',
      getValue: (p: ComparisonProposal) => (
        <div className="flex items-center gap-1">
          {p.isVerified ? (
            <>
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-green-600 text-sm">Geprüftes Profil</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">–</span>
          )}
        </div>
      ),
    },
    {
      label: 'Versichert',
      getValue: (p: ComparisonProposal) => (
        <div className="flex items-center gap-1">
          {p.hasInsurance ? (
            <>
              <Shield className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600 text-sm">Haftpflicht</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">–</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Offerten vergleichen ({proposals.length})</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-6 pt-4">
            {/* Mobile: Cards layout */}
            <div className="md:hidden space-y-4">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="border rounded-lg p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    {proposal.logoUrl ? (
                      <img 
                        src={proposal.logoUrl} 
                        alt={`Firmenlogo von ${proposal.companyName || proposal.handwerkerName}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                        {proposal.handwerkerName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">
                        {proposal.companyName || proposal.handwerkerName}
                      </div>
                      <div className="text-xs text-muted-foreground">{proposal.handwerkerCity}</div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-2 text-sm">
                    {metrics.map((metric) => (
                      <div key={metric.label} className="flex justify-between items-center">
                        <span className="text-muted-foreground">{metric.label}</span>
                        {metric.getValue(proposal)}
                      </div>
                    ))}
                  </div>

                  {/* Message preview */}
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {proposal.message}
                  </div>

                  {/* Actions */}
                  {proposal.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => onAccept(proposal.id)} 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Annehmen
                      </Button>
                      <Button 
                        onClick={() => onReject(proposal.id)} 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Ablehnen
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-muted/50 rounded-tl-lg w-32"></th>
                    {proposals.map((proposal) => (
                      <th key={proposal.id} className="p-3 bg-muted/50 last:rounded-tr-lg">
                        <div className="flex flex-col items-center gap-2">
                          {proposal.logoUrl ? (
                            <img 
                              src={proposal.logoUrl} 
                              alt={`Firmenlogo von ${proposal.companyName || proposal.handwerkerName}`}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-xl font-semibold">
                              {proposal.handwerkerName.charAt(0)}
                            </div>
                          )}
                          <div className="text-center">
                            <div className="font-semibold text-sm">
                              {proposal.companyName || proposal.handwerkerName}
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric, idx) => (
                    <tr key={metric.label} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
                      <td className="p-3 text-sm font-medium text-muted-foreground">
                        {metric.label}
                      </td>
                      {proposals.map((proposal) => (
                        <td key={proposal.id} className="p-3 text-center">
                          <div className="flex justify-center">
                            {metric.getValue(proposal)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  
                  {/* Message row */}
                  <tr>
                    <td className="p-3 text-sm font-medium text-muted-foreground align-top">
                      Nachricht
                    </td>
                    {proposals.map((proposal) => (
                      <td key={proposal.id} className="p-3">
                        <div className="text-sm text-muted-foreground line-clamp-3 text-left">
                          {proposal.message}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Actions row */}
                  <tr className="border-t">
                    <td className="p-3"></td>
                    {proposals.map((proposal) => (
                      <td key={proposal.id} className="p-3">
                        {proposal.status === 'pending' && (
                          <div className="flex flex-col gap-2">
                            <Button 
                              onClick={() => onAccept(proposal.id)} 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Annehmen
                            </Button>
                            <Button 
                              onClick={() => onReject(proposal.id)} 
                              size="sm" 
                              variant="outline"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Ablehnen
                            </Button>
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
