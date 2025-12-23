import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useAdminGuard } from "@/hooks/useAuthGuard";
import { RefreshCw, ChevronDown, ChevronRight, Eye, Mail, Phone, MapPin, Pause, Play, Trash2 } from "lucide-react";
import { majorCategories } from "@/config/majorCategories";
import { SWISS_CANTONS, getCantonLabel } from "@/config/cantons";
import { getUrgencyLabel } from "@/config/urgencyLevels";
import { getCategoryLabel } from "@/config/categoryLabels";
import { LEAD_STATUSES } from "@/config/leadStatuses";
import { ProposalStatusBadge } from "@/components/ProposalStatusBadge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { formatBudget } from "@/lib/swissTime";
import { EmptyState, InlineEmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/page-skeleton";
import type { LeadWithOwnerContact, AdminProposal } from "@/types/entities";


export default function AdminLeadsManagement() {
  const navigate = useNavigate();
  const { loading: authLoading, isAuthorized } = useAdminGuard();
  const [leads, setLeads] = useState<LeadWithOwnerContact[]>([]);
  const [proposals, setProposals] = useState<Record<string, AdminProposal[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<LeadWithOwnerContact | null>(null);
  const [actionLead, setActionLead] = useState<LeadWithOwnerContact | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'pause' | 'delete' | 'reactivate'>('pause');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cantonFilter, setCantonFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!authLoading && isAuthorized) {
      fetchLeads();
    }
  }, [authLoading, isAuthorized]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      // Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (leadsError) throw leadsError;

      // Get unique owner IDs
      const ownerIds = [...new Set(leadsData?.map(l => l.owner_id).filter(Boolean))];
      
      // Fetch owners
      let owners: Record<string, any> = {};
      if (ownerIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", ownerIds);
        
        if (!profilesError && profilesData) {
          profilesData.forEach(p => {
            owners[p.id] = p;
          });
        }
      }

      // Combine data
      const formattedLeads = leadsData?.map((lead: any) => ({
        ...lead,
        owner_name: owners[lead.owner_id]?.full_name || "Unbekannt",
        owner_email: owners[lead.owner_id]?.email || "Unbekannt",
        owner_phone: owners[lead.owner_id]?.phone,
      })) || [];

      setLeads(formattedLeads);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast.error("Fehler beim Laden der Aufträge");
    } finally {
      setLoading(false);
    }
  };

  const fetchProposalsForLead = async (leadId: string) => {
    if (proposals[leadId]) return;

    try {
      // Fetch proposals
      const { data: proposalsData, error: proposalsError } = await supabase
        .from("lead_proposals")
        .select("*")
        .eq("lead_id", leadId)
        .order("submitted_at", { ascending: false });

      if (proposalsError) throw proposalsError;

      // Get handwerker IDs
      const handwerkerIds = [...new Set(proposalsData?.map(p => p.handwerker_id).filter(Boolean))];
      
      // Fetch handwerker profiles
      let handwerkers: Record<string, any> = {};
      if (handwerkerIds.length > 0) {
        const { data: hwData } = await supabase
          .from("handwerker_profiles")
          .select("user_id, first_name, last_name, company_name, email, phone_number, business_city")
          .in("user_id", handwerkerIds);
        
        if (hwData) {
          hwData.forEach(h => {
            handwerkers[h.user_id] = h;
          });
        }
      }

      // Combine data
      const formattedProposals = proposalsData?.map((proposal: any) => ({
        ...proposal,
        handwerker_first_name: handwerkers[proposal.handwerker_id]?.first_name,
        handwerker_last_name: handwerkers[proposal.handwerker_id]?.last_name,
        handwerker_company_name: handwerkers[proposal.handwerker_id]?.company_name,
        handwerker_email: handwerkers[proposal.handwerker_id]?.email,
        handwerker_phone: handwerkers[proposal.handwerker_id]?.phone_number,
        handwerker_city: handwerkers[proposal.handwerker_id]?.business_city,
      })) || [];

      setProposals((prev) => ({ ...prev, [leadId]: formattedProposals }));
    } catch (error) {
      console.error("Error fetching proposals:", error);
      toast.error("Fehler beim Laden der Offerten");
    }
  };

  const toggleLeadExpansion = async (leadId: string) => {
    const newExpanded = new Set(expandedLeads);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
      await fetchProposalsForLead(leadId);
    }
    setExpandedLeads(newExpanded);
  };

  const handleLeadAction = (lead: LeadWithOwnerContact, action: 'pause' | 'delete' | 'reactivate') => {
    setActionLead(lead);
    setActionType(action);
    setShowActionDialog(true);
  };

  const executeLeadAction = async () => {
    if (!actionLead) return;

    try {
      let newStatus: 'active' | 'paused' | 'deleted';
      let actionDescription: string;

      switch (actionType) {
        case 'pause':
          newStatus = 'paused';
          actionDescription = 'pausiert';
          break;
        case 'delete':
          newStatus = 'deleted';
          actionDescription = 'gelöscht';
          break;
        case 'reactivate':
          newStatus = 'active';
          actionDescription = 'reaktiviert';
          break;
      }

      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', actionLead.id);

      if (error) throw error;

      toast.success(`Auftrag wurde ${actionDescription}.`);

      fetchLeads();
      setShowActionDialog(false);
      setActionLead(null);
    } catch (error: any) {
      console.error('Error updating lead status:', error);
      toast.error(error.message || 'Beim Aktualisieren des Auftrags ist ein Fehler aufgetreten.');
    }
  };

  const getActionDialogContent = () => {
    switch (actionType) {
      case 'pause':
        return {
          title: 'Auftrag pausieren',
          description: 'Möchten Sie diesen Auftrag wirklich pausieren? Er wird nicht mehr für Handwerker sichtbar sein.',
          actionLabel: 'Pausieren',
        };
      case 'delete':
        return {
          title: 'Auftrag löschen',
          description: 'Möchten Sie diesen Auftrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
          actionLabel: 'Löschen',
        };
      case 'reactivate':
        return {
          title: 'Auftrag reaktivieren',
          description: 'Möchten Sie diesen Auftrag wieder aktivieren? Er wird dann wieder für Handwerker sichtbar sein.',
          actionLabel: 'Reaktivieren',
        };
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (statusFilter !== "all" && lead.status !== statusFilter) return false;
    if (categoryFilter !== "all" && lead.category !== categoryFilter) return false;
    if (cantonFilter !== "all" && lead.canton !== cantonFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        lead.title.toLowerCase().includes(query) ||
        lead.owner_email.toLowerCase().includes(query) ||
        lead.owner_name?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Use centralized formatBudget from swissTime.ts (SSOT)
  const formatLeadBudget = (lead: LeadWithOwnerContact) => {
    return formatBudget(lead.budget_min, lead.budget_max, lead.budget_type as any);
  };

  const isReady = !authLoading && isAuthorized && !loading;

  if (authLoading || !isAuthorized) {
    if (authLoading) {
      return (
        <AdminLayout title="Lead-Verwaltung" description="Alle Aufträge und Offerten im Überblick">
          <div className="space-y-6">
            <div className="flex justify-end mb-6">
              <div className="h-10 w-32 bg-muted animate-pulse rounded" />
            </div>
            <TableSkeleton rows={5} columns={6} />
          </div>
        </AdminLayout>
      );
    }
    return null;
  }

  return (
    <AdminLayout title="Lead-Verwaltung" description="Alle Aufträge und Offerten im Überblick" isLoading={!isReady}>
      <div className="flex justify-end mb-6">
        <Button onClick={fetchLeads} disabled={loading} className="shrink-0">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </Button>
      </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="paused">Pausiert</SelectItem>
                  <SelectItem value="completed">Abgeschlossen</SelectItem>
                  <SelectItem value="draft">Entwurf</SelectItem>
                  <SelectItem value="deleted">Gelöscht</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  {Object.values(majorCategories).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={cantonFilter} onValueChange={setCantonFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kanton" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kantone</SelectItem>
                  {SWISS_CANTONS.map((canton) => (
                    <SelectItem key={canton.value} value={canton.value}>
                      {canton.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Suche nach Titel, E-Mail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

      {loading ? (
        <Card className="p-6">
          <TableSkeleton rows={5} columns={6} />
        </Card>
      ) : filteredLeads.length === 0 ? (
        <EmptyState 
          variant="leads"
          title="Keine Aufträge gefunden"
          description="Es wurden keine Aufträge gefunden, die Ihren Filterkriterien entsprechen."
        />
      ) : (
        <Card>
          <ScrollArea className="h-[600px]">
            <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Auftrag</TableHead>
                  <TableHead className="hidden md:table-cell">Auftraggeber</TableHead>
                  <TableHead className="hidden lg:table-cell">Kategorie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Standort</TableHead>
                  <TableHead className="hidden lg:table-cell">Budget</TableHead>
                  <TableHead className="hidden lg:table-cell">Dringlichkeit</TableHead>
                  <TableHead className="hidden sm:table-cell">Offerten</TableHead>
                  <TableHead className="hidden md:table-cell">Erstellt</TableHead>
                  <TableHead className="w-32">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <Collapsible key={lead.id} asChild open={expandedLeads.has(lead.id)}>
                    <>
                      <TableRow>
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLeadExpansion(lead.id)}
                            >
                              {expandedLeads.has(lead.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium">{lead.title}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-sm">
                            <div className="font-medium">{lead.owner_name || "Unbekannt"}</div>
                            <div className="text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.owner_email}
                            </div>
                            {lead.owner_phone && (
                              <div className="text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {lead.owner_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {getCategoryLabel(lead.category)}
                        </TableCell>
                        <TableCell>
                          <Badge className={LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES]?.color || 'bg-gray-500'}>
                            {LEAD_STATUSES[lead.status as keyof typeof LEAD_STATUSES]?.label || lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {lead.city}, {getCantonLabel(lead.canton)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{formatLeadBudget(lead)}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{getUrgencyLabel(lead.urgency)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{lead.proposals_count || 0}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {format(new Date(lead.created_at), "dd.MM.yyyy", { locale: de })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLead(lead)}
                              title="Details anzeigen"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {lead.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLeadAction(lead, 'pause')}
                                title="Auftrag pausieren"
                              >
                                <Pause className="h-4 w-4 text-orange-600" />
                              </Button>
                            )}
                            {lead.status === 'paused' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLeadAction(lead, 'reactivate')}
                                title="Auftrag reaktivieren"
                              >
                                <Play className="h-4 w-4 text-green-600" />
                              </Button>
                            )}
                            {(lead.status === 'active' || lead.status === 'paused') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleLeadAction(lead, 'delete')}
                                title="Auftrag löschen"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={11} className="bg-muted/50">
                            <div className="p-4">
                              <h4 className="font-semibold mb-3">Eingereichte Offerten ({proposals[lead.id]?.length || 0})</h4>
                              {proposals[lead.id] && proposals[lead.id].length > 0 ? (
                                <div className="space-y-3">
                                  {proposals[lead.id].map((proposal) => (
                                    <div key={proposal.id} className="bg-background rounded-lg p-4 border">
                                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                          <div className="text-sm text-muted-foreground">Handwerker</div>
                                          <div className="font-medium">
                                            {proposal.handwerker_company_name ||
                                              `${proposal.handwerker_first_name} ${proposal.handwerker_last_name}`}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {proposal.handwerker_email}
                                          </div>
                                          {proposal.handwerker_city && (
                                            <div className="text-sm text-muted-foreground">
                                              {proposal.handwerker_city}
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-sm text-muted-foreground">Preisspanne</div>
                                          <div className="font-medium">
                                            CHF {proposal.price_min.toLocaleString()} -{" "}
                                            {proposal.price_max.toLocaleString()}
                                          </div>
                                          {proposal.estimated_duration_days && (
                                            <div className="text-sm text-muted-foreground mt-1">
                                              Dauer: ~{proposal.estimated_duration_days} Tage
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-sm text-muted-foreground">Status</div>
                                          <ProposalStatusBadge status={proposal.status} />
                                          <div className="text-sm text-muted-foreground mt-2">
                                            Eingereicht: {format(new Date(proposal.submitted_at), "dd.MM.yyyy HH:mm", { locale: de })}
                                          </div>
                                          {proposal.responded_at && (
                                            <div className="text-sm text-muted-foreground">
                                              Beantwortet: {format(new Date(proposal.responded_at), "dd.MM.yyyy HH:mm", { locale: de })}
                                            </div>
                                          )}
                                        </div>
                                        <div>
                                          <div className="text-sm text-muted-foreground">Nachricht</div>
                                          <div className="text-sm line-clamp-3">{proposal.message}</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-sm">Noch keine Offerten eingereicht</div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                ))}
              </TableBody>
            </Table>
            </div>
          </ScrollArea>
        </Card>
      )}

        <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedLead?.title}</DialogTitle>
            </DialogHeader>
            {selectedLead && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Beschreibung</h4>
                  <p className="text-sm whitespace-pre-wrap">{selectedLead.description}</p>
                </div>

                {selectedLead.media_urls && selectedLead.media_urls.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Medien ({selectedLead.media_urls.length})</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedLead.media_urls.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Lead media ${idx + 1}`}
                          className="rounded-lg object-cover w-full h-32"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <h4 className="font-semibold mb-2">Auftraggeber</h4>
                    <div className="text-sm space-y-1">
                      <div>{selectedLead.owner_name || "Unbekannt"}</div>
                      <div className="text-muted-foreground">{selectedLead.owner_email}</div>
                      {selectedLead.owner_phone && (
                        <div className="text-muted-foreground">{selectedLead.owner_phone}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Details</h4>
                    <div className="text-sm space-y-1">
                      <div>Kategorie: {getCategoryLabel(selectedLead.category)}</div>
                      <div>Ort: {selectedLead.city}, {getCantonLabel(selectedLead.canton)} {selectedLead.zip}</div>
                      <div>Budget: {formatLeadBudget(selectedLead)}</div>
                      <div>Dringlichkeit: {getUrgencyLabel(selectedLead.urgency)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Lead Action Confirmation Dialog */}
        <AlertDialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{getActionDialogContent().title}</AlertDialogTitle>
              <AlertDialogDescription>
                {getActionDialogContent().description}
                <br /><br />
                <strong>Auftrag:</strong> {actionLead?.title}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setShowActionDialog(false);
                setActionLead(null);
              }}>
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction onClick={executeLeadAction}>
                {getActionDialogContent().actionLabel}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </AdminLayout>
  );
}