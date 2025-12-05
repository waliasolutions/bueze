import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RatingForm } from './RatingForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UnratedLead {
  id: string;
  title: string;
  handwerker_id: string;
  handwerker_name: string;
  completed_at: string;
}

interface RatingPromptProps {
  userId: string;
}

export const RatingPrompt: React.FC<RatingPromptProps> = ({ userId }) => {
  const [unratedLeads, setUnratedLeads] = useState<UnratedLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<UnratedLead | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchUnratedLeads();
  }, [userId]);

  const fetchUnratedLeads = async () => {
    try {
      // Get completed leads owned by user that have an accepted proposal
      const { data: completedLeads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          id,
          title,
          updated_at,
          accepted_proposal_id,
          lead_proposals!leads_accepted_proposal_id_fkey(
            handwerker_id
          )
        `)
        .eq('owner_id', userId)
        .eq('status', 'completed')
        .not('accepted_proposal_id', 'is', null);

      if (leadsError) throw leadsError;
      if (!completedLeads || completedLeads.length === 0) return;

      // Get existing reviews for these leads
      const leadIds = completedLeads.map(l => l.id);
      const { data: existingReviews } = await supabase
        .from('reviews')
        .select('lead_id')
        .in('lead_id', leadIds)
        .eq('reviewer_id', userId);

      const reviewedLeadIds = new Set(existingReviews?.map(r => r.lead_id) || []);

      // Filter to unrated leads and fetch handwerker names
      const unratedLeadsData = await Promise.all(
        completedLeads
          .filter(lead => !reviewedLeadIds.has(lead.id))
          .map(async (lead) => {
            const handwerkerId = (lead.lead_proposals as any)?.handwerker_id;
            if (!handwerkerId) return null;

            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', handwerkerId)
              .single();

            return {
              id: lead.id,
              title: lead.title,
              handwerker_id: handwerkerId,
              handwerker_name: profile?.full_name || 'Handwerker',
              completed_at: lead.updated_at,
            };
          })
      );

      setUnratedLeads(unratedLeadsData.filter(Boolean) as UnratedLead[]);
    } catch (error) {
      console.error('Error fetching unrated leads:', error);
    }
  };

  const handleDismiss = (leadId: string) => {
    setDismissed(prev => new Set([...prev, leadId]));
  };

  const handleRatingSuccess = () => {
    setSelectedLead(null);
    fetchUnratedLeads();
  };

  const visibleLeads = unratedLeads.filter(lead => !dismissed.has(lead.id));

  if (visibleLeads.length === 0) return null;

  return (
    <>
      <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-900/10 dark:border-yellow-800">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-base">Bewertungen ausstehend</CardTitle>
          </div>
          <CardDescription>
            Teilen Sie Ihre Erfahrung mit anderen Kunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {visibleLeads.slice(0, 3).map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-3 bg-background rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{lead.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Handwerker: {lead.handwerker_name}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <Star className="h-4 w-4 mr-1" />
                    Bewerten
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(lead.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {visibleLeads.length > 3 && (
            <p className="text-sm text-muted-foreground mt-3">
              +{visibleLeads.length - 3} weitere ausstehende Bewertungen
            </p>
          )}
        </CardContent>
      </Card>

      {/* Rating Dialog */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bewertung abgeben</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <RatingForm
              leadId={selectedLead.id}
              handwerkerId={selectedLead.handwerker_id}
              handwerkerName={selectedLead.handwerker_name}
              leadTitle={selectedLead.title}
              onSuccess={handleRatingSuccess}
              onCancel={() => setSelectedLead(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};