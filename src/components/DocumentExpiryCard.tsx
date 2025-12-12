import { useState } from 'react';
import { format, differenceInDays, isPast, isFuture, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Upload, 
  Trash2,
  Download,
  Calendar,
  Shield,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  document_url: string;
  expiry_date: string | null;
  issued_date: string | null;
  status: string;
  verified_at: string | null;
}

interface DocumentExpiryCardProps {
  documents: Document[];
  onUpload: (type: string) => void;
  onDelete: (id: string) => void;
  onDownload: (url: string, name: string) => void;
  uploading?: boolean;
}

const DOCUMENT_TYPES = [
  { id: 'liability_insurance', label: 'Haftpflichtversicherung', icon: Shield, required: true },
  { id: 'professional_insurance', label: 'Berufshaftpflichtversicherung', icon: Shield, required: false },
  { id: 'trade_license', label: 'Gewerbebewilligung', icon: FileText, required: false },
  { id: 'master_certificate', label: 'Meisterbrief', icon: FileText, required: false },
  { id: 'safety_certification', label: 'Sicherheitszertifikat', icon: Shield, required: false },
  { id: 'certification', label: 'Weitere Zertifizierung', icon: FileText, required: false },
];

function getExpiryStatus(expiryDate: string | null): {
  status: 'valid' | 'expiring_soon' | 'expiring_warning' | 'expiring_critical' | 'expired' | 'no_expiry';
  daysRemaining: number | null;
  color: string;
  bgColor: string;
  label: string;
} {
  if (!expiryDate) {
    return { 
      status: 'no_expiry', 
      daysRemaining: null, 
      color: 'text-muted-foreground', 
      bgColor: 'bg-muted',
      label: 'Kein Ablaufdatum' 
    };
  }

  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  
  const days = differenceInDays(expiry, today);

  if (days < 0) {
    return { 
      status: 'expired', 
      daysRemaining: days, 
      color: 'text-destructive', 
      bgColor: 'bg-destructive/10',
      label: 'Abgelaufen' 
    };
  } else if (days <= 7) {
    return { 
      status: 'expiring_critical', 
      daysRemaining: days, 
      color: 'text-destructive', 
      bgColor: 'bg-destructive/10',
      label: `Läuft in ${days} Tagen ab` 
    };
  } else if (days <= 14) {
    return { 
      status: 'expiring_warning', 
      daysRemaining: days, 
      color: 'text-orange-600', 
      bgColor: 'bg-orange-50',
      label: `Läuft in ${days} Tagen ab` 
    };
  } else if (days <= 30) {
    return { 
      status: 'expiring_soon', 
      daysRemaining: days, 
      color: 'text-yellow-600', 
      bgColor: 'bg-yellow-50',
      label: `Läuft in ${days} Tagen ab` 
    };
  } else {
    return { 
      status: 'valid', 
      daysRemaining: days, 
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      label: 'Gültig' 
    };
  }
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
  const { status, daysRemaining, color, bgColor, label } = getExpiryStatus(expiryDate);
  
  const Icon = status === 'expired' ? XCircle 
    : status === 'expiring_critical' ? AlertTriangle 
    : status === 'expiring_warning' ? AlertTriangle
    : status === 'expiring_soon' ? Clock
    : status === 'valid' ? CheckCircle 
    : Calendar;

  return (
    <Badge variant="outline" className={cn('gap-1', color, bgColor, 'border-0')}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function DocumentRow({ 
  doc, 
  typeInfo, 
  onDelete, 
  onDownload 
}: { 
  doc: Document; 
  typeInfo: typeof DOCUMENT_TYPES[0];
  onDelete: (id: string) => void;
  onDownload: (url: string, name: string) => void;
}) {
  const { status } = getExpiryStatus(doc.expiry_date);
  const Icon = typeInfo.icon;

  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg border',
      status === 'expired' && 'border-destructive/50 bg-destructive/5',
      status === 'expiring_critical' && 'border-destructive/30 bg-destructive/5',
      status === 'expiring_warning' && 'border-orange-300 bg-orange-50',
      status === 'expiring_soon' && 'border-yellow-300 bg-yellow-50',
      status === 'valid' && 'border-green-200 bg-green-50/50',
      status === 'no_expiry' && 'border-border bg-background'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'p-2 rounded-lg',
          status === 'expired' || status === 'expiring_critical' ? 'bg-destructive/10' : 
          status === 'expiring_warning' ? 'bg-orange-100' :
          status === 'expiring_soon' ? 'bg-yellow-100' :
          status === 'valid' ? 'bg-green-100' : 'bg-muted'
        )}>
          <Icon className={cn(
            'h-4 w-4',
            status === 'expired' || status === 'expiring_critical' ? 'text-destructive' :
            status === 'expiring_warning' ? 'text-orange-600' :
            status === 'expiring_soon' ? 'text-yellow-600' :
            status === 'valid' ? 'text-green-600' : 'text-muted-foreground'
          )} />
        </div>
        <div>
          <p className="font-medium text-sm">{doc.document_name || typeInfo.label}</p>
          {doc.expiry_date && (
            <p className="text-xs text-muted-foreground">
              Gültig bis: {format(new Date(doc.expiry_date), 'dd.MM.yyyy', { locale: de })}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <ExpiryBadge expiryDate={doc.expiry_date} />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onDownload(doc.document_url, doc.document_name)}
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(doc.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function DocumentExpiryCard({ 
  documents, 
  onUpload, 
  onDelete, 
  onDownload,
  uploading 
}: DocumentExpiryCardProps) {
  // Group documents by type
  const documentsByType = documents.reduce((acc, doc) => {
    if (!acc[doc.document_type]) {
      acc[doc.document_type] = [];
    }
    acc[doc.document_type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  // Calculate overall status
  const expiredCount = documents.filter(d => {
    const status = getExpiryStatus(d.expiry_date);
    return status.status === 'expired';
  }).length;

  const expiringCount = documents.filter(d => {
    const status = getExpiryStatus(d.expiry_date);
    return ['expiring_critical', 'expiring_warning', 'expiring_soon'].includes(status.status);
  }).length;

  const validCount = documents.filter(d => {
    const status = getExpiryStatus(d.expiry_date);
    return status.status === 'valid' || status.status === 'no_expiry';
  }).length;

  const totalWithExpiry = documents.filter(d => d.expiry_date).length;
  const validPercentage = totalWithExpiry > 0 
    ? Math.round((validCount / totalWithExpiry) * 100) 
    : 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumente & Versicherungen
            </CardTitle>
            <CardDescription>
              Verwalten Sie Ihre Geschäftsdokumente und Zertifizierungen
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{validPercentage}%</div>
            <p className="text-xs text-muted-foreground">Dokumente gültig</p>
          </div>
        </div>
        
        <Progress value={validPercentage} className="h-2 mt-2" />
        
        {(expiredCount > 0 || expiringCount > 0) && (
          <Alert variant={expiredCount > 0 ? 'destructive' : 'default'} className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {expiredCount > 0 && (
                <span className="font-medium">
                  {expiredCount} Dokument(e) abgelaufen. 
                </span>
              )}
              {expiringCount > 0 && (
                <span>
                  {' '}{expiringCount} Dokument(e) laufen bald ab.
                </span>
              )}
              {' '}Bitte aktualisieren Sie diese zeitnah.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {DOCUMENT_TYPES.map((type) => {
          const docs = documentsByType[type.id] || [];
          const hasDocument = docs.length > 0;

          return (
            <div key={type.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{type.label}</span>
                  {type.required && (
                    <Badge variant="outline" className="text-xs">Erforderlich</Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpload(type.id)}
                  disabled={uploading}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {hasDocument ? 'Ersetzen' : 'Hochladen'}
                </Button>
              </div>
              
              {docs.map((doc) => (
                <DocumentRow 
                  key={doc.id} 
                  doc={doc} 
                  typeInfo={type}
                  onDelete={onDelete}
                  onDownload={onDownload}
                />
              ))}
              
              {!hasDocument && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-dashed">
                  <div className="p-2 rounded-lg bg-muted">
                    <type.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Noch kein Dokument hochgeladen
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export { DOCUMENT_TYPES, getExpiryStatus, ExpiryBadge };
