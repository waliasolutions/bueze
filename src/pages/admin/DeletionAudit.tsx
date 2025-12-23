import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Loader2, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye,
  RefreshCw,
  Trash2,
  Calendar
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface DeletionAuditRecord {
  id: string;
  deleted_email: string;
  deleted_user_id: string | null;
  deletion_type: string;
  deleted_by: string | null;
  success: boolean | null;
  verified_clean: boolean | null;
  deletion_stats: Record<string, number> | unknown | null;
  orphaned_records: Record<string, unknown> | unknown | null;
  error_message: string | null;
  created_at: string;
}

export default function DeletionAudit() {
  const { isChecking, hasChecked, isAuthorized } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<DeletionAuditRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<DeletionAuditRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<DeletionAuditRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (hasChecked && isAuthorized) {
      loadRecords();
    }
  }, [hasChecked, isAuthorized]);

  useEffect(() => {
    let filtered = records;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (record) =>
          record.deleted_email.toLowerCase().includes(query) ||
          record.deletion_type.toLowerCase().includes(query) ||
          record.deleted_user_id?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'success') {
        filtered = filtered.filter((r) => r.success && r.verified_clean);
      } else if (statusFilter === 'warning') {
        filtered = filtered.filter((r) => r.success && !r.verified_clean);
      } else if (statusFilter === 'failed') {
        filtered = filtered.filter((r) => !r.success);
      }
    }

    setFilteredRecords(filtered);
  }, [searchQuery, statusFilter, records]);

  const loadRecords = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('deletion_audit')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      setRecords(data || []);
    } catch (error) {
      console.error('Error loading deletion audit:', error);
      toast.error('Löschprotokoll konnte nicht geladen werden.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (record: DeletionAuditRecord) => {
    if (!record.success) {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          Fehlgeschlagen
        </Badge>
      );
    }
    if (!record.verified_clean) {
      return (
        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800">
          <AlertTriangle className="h-3 w-3" />
          Mit Warnungen
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        Erfolgreich
      </Badge>
    );
  };

  const getDeletionTypeLabel = (type: string) => {
    switch (type) {
      case 'full_user_deletion':
        return 'Vollständige Löschung';
      case 'guest_deletion':
        return 'Gast-Löschung';
      default:
        return type;
    }
  };

  const getTotalDeleted = (stats: Record<string, number> | unknown | null) => {
    if (!stats || typeof stats !== 'object') return 0;
    return Object.values(stats as Record<string, number>).reduce((sum, val) => sum + (val || 0), 0);
  };

  const openDetail = (record: DeletionAuditRecord) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  if ((isChecking && !hasChecked) || !isAuthorized) {
    return <PageSkeleton />;
  }

  if (loading) {
    return (
      <AdminLayout title="Löschprotokoll" description="Übersicht aller Benutzerlöschungen">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Löschprotokoll" description="Übersicht aller Benutzerlöschungen">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="relative flex-1 w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="E-Mail oder ID suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status filtern" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="success">Erfolgreich</SelectItem>
            <SelectItem value="warning">Mit Warnungen</SelectItem>
            <SelectItem value="failed">Fehlgeschlagen</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={loadRecords} disabled={isRefreshing} variant="outline" className="gap-2">
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Aktualisieren
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt</CardDescription>
            <CardTitle className="text-2xl">{records.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600">Erfolgreich</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              {records.filter((r) => r.success && r.verified_clean).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-amber-600">Mit Warnungen</CardDescription>
            <CardTitle className="text-2xl text-amber-600">
              {records.filter((r) => r.success && !r.verified_clean).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-destructive">Fehlgeschlagen</CardDescription>
            <CardTitle className="text-2xl text-destructive">
              {records.filter((r) => !r.success).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Löschprotokoll
          </CardTitle>
          <CardDescription>
            {filteredRecords.length} {filteredRecords.length === 1 ? 'Eintrag' : 'Einträge'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <EmptyState
              icon={Trash2}
              title="Keine Einträge"
              description="Es wurden noch keine Löschungen protokolliert."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gelöschte Datensätze</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(new Date(record.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{record.deleted_email}</TableCell>
                    <TableCell>{getDeletionTypeLabel(record.deletion_type)}</TableCell>
                    <TableCell>{getStatusBadge(record)}</TableCell>
                    <TableCell>{getTotalDeleted(record.deletion_stats)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openDetail(record)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Löschdetails
              {selectedRecord && getStatusBadge(selectedRecord)}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.deleted_email}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Datum</p>
                    <p>{format(new Date(selectedRecord.created_at), 'dd.MM.yyyy HH:mm:ss', { locale: de })}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Typ</p>
                    <p>{getDeletionTypeLabel(selectedRecord.deletion_type)}</p>
                  </div>
                  {selectedRecord.deleted_user_id && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">User ID</p>
                      <p className="font-mono text-xs">{selectedRecord.deleted_user_id}</p>
                    </div>
                  )}
                  {selectedRecord.deleted_by && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gelöscht von</p>
                      <p className="font-mono text-xs">{selectedRecord.deleted_by}</p>
                    </div>
                  )}
                </div>

                {/* Deletion Stats */}
                {selectedRecord.deletion_stats && Object.keys(selectedRecord.deletion_stats).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Gelöschte Datensätze</p>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(selectedRecord.deletion_stats).map(([table, count]) => (
                          <div key={table} className="flex justify-between">
                            <span className="text-muted-foreground">{table}:</span>
                            <span className="font-medium">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Orphaned Records */}
                {selectedRecord.orphaned_records && Object.keys(selectedRecord.orphaned_records).length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-amber-600 mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      Verwaiste Datensätze
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedRecord.orphaned_records, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {selectedRecord.error_message && (
                  <div>
                    <p className="text-sm font-medium text-destructive mb-2 flex items-center gap-1">
                      <XCircle className="h-4 w-4" />
                      Fehlermeldung
                    </p>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                      <p className="text-sm text-destructive">{selectedRecord.error_message}</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
