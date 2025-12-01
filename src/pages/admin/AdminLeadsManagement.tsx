import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { RefreshCw, ChevronDown, ChevronRight, Eye, Mail, Phone, MapPin } from "lucide-react";
import { majorCategories } from "@/config/majorCategories";
import { SWISS_CANTONS } from "@/config/cantons";
import { getUrgencyLabel } from "@/config/urgencyLevels";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface LeadWithOwner {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  city: string;
  canton: string;
  zip: string;
  budget_min: number | null;
  budget_max: number | null;
  budget_type: string;
  urgency: string;
  proposals_count: number;
  created_at: string;
  media_urls: string[] | null;
  owner_id: string;
  owner_name: string | null;
  owner_email: string;
  owner_phone: string | null;
}

interface Proposal {
  id: string;
  lead_id: string;
  handwerker_id: string;
  price_min: number;
  price_max: number;
  estimated_duration_days: number | null;
  message: string;
  status: string;
  submitted_at: string;
  responded_at: string | null;
  handwerker_first_name: string | null;
  handwerker_last_name: string | null;
  handwerker_company_name: string | null;
  handwerker_email: string | null;
  handwerker_phone: string | null;
  handwerker_city: string | null;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  paused: "bg-orange-500",
  completed: "bg-blue-500",
  deleted: "bg-gray-500",
  draft: "bg-gray-400",
  pending: "bg-yellow-500",
  accepted: "bg-green-500",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  paused: "Pausiert",
  completed: "Abgeschlossen",
  deleted: "Gelöscht",
  draft: "Entwurf",
  pending: "Ausstehend",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
  withdrawn: "Zurückgezogen",
};

export default function AdminLeadsManagement() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadWithOwner[]>([]);
  const [proposals, setProposals] = useState<Record<string, Proposal[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedLeads, setExpandedLeads] = useState<Set<string>>(new Set());
  const [selectedLead, setSelectedLead] = useState<LeadWithOwner | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [cantonFilter, setCantonFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (roleData?.role !== "admin" && roleData?.role !== "super_admin") {
        toast.error("Zugriff verweigert");
        navigate("/");
        return;
      }

      await fetchLeads();
    } catch (error) {
      console.error("Error checking admin status:", error);
      toast.error("Fehler beim Laden");
    }
  };

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

  const formatBudget = (lead: LeadWithOwner) => {
    if (lead.budget_type === "estimate") return "Nach Offerte";
    if (lead.budget_min && lead.budget_max) {
      return `CHF ${lead.budget_min.toLocaleString()} - ${lead.budget_max.toLocaleString()}`;
    }
    return "Keine Angabe";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Lead-Verwaltung</h1>
          <p className="text-muted-foreground mt-1">Alle Aufträge und Offerten im Überblick</p>
        </div>
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
        <Card className="p-12">
          <div className="flex justify-center items-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-3 text-muted-foreground">Lade Aufträge...</span>
          </div>
        </Card>
      ) : filteredLeads.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            Keine Aufträge gefunden
          </div>
        </Card>
      ) : (
        <Card>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Auftrag</TableHead>
                  <TableHead>Auftraggeber</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Standort</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Dringlichkeit</TableHead>
                  <TableHead>Offerten</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="w-24">Aktionen</TableHead>
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
                        <TableCell>
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
                        <TableCell>
                          {Object.values(majorCategories).find((c) => c.id === lead.category)?.label || lead.category}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[lead.status]}>
                            {statusLabels[lead.status] || lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {lead.city}, {lead.canton}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{formatBudget(lead)}</TableCell>
                        <TableCell className="text-sm">{getUrgencyLabel(lead.urgency)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.proposals_count || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(lead.created_at), "dd.MM.yyyy", { locale: de })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLead(lead)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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
                                          <Badge className={statusColors[proposal.status]}>
                                            {statusLabels[proposal.status]}
                                          </Badge>
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
                      <div>Kategorie: {Object.values(majorCategories).find((c) => c.id === selectedLead.category)?.label}</div>
                      <div>Ort: {selectedLead.city}, {selectedLead.canton} {selectedLead.zip}</div>
                      <div>Budget: {formatBudget(selectedLead)}</div>
                      <div>Dringlichkeit: {getUrgencyLabel(selectedLead.urgency)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
