import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Building2 } from 'lucide-react';

interface BillingSettingsForm {
  company_name: string;
  company_legal_name: string;
  company_street: string;
  company_zip: string;
  company_city: string;
  company_country: string;
  company_email: string;
  company_phone: string;
  company_website: string;
  mwst_number: string;
  mwst_rate: string;
  mwst_note: string;
  mwst_mode: 'none' | 'exclusive';
}

const AdminBillingSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [form, setForm] = useState<BillingSettingsForm>({
    company_name: '',
    company_legal_name: '',
    company_street: '',
    company_zip: '',
    company_city: '',
    company_country: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    mwst_number: '',
    mwst_rate: '0',
    mwst_note: '',
    mwst_mode: 'none',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('billing_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setSettingsId(data.id);
        setForm({
          company_name: data.company_name || '',
          company_legal_name: data.company_legal_name || '',
          company_street: data.company_street || '',
          company_zip: data.company_zip || '',
          company_city: data.company_city || '',
          company_country: data.company_country || '',
          company_email: data.company_email || '',
          company_phone: data.company_phone || '',
          company_website: data.company_website || '',
          mwst_number: data.mwst_number || '',
          mwst_rate: String(data.mwst_rate ?? 0),
          mwst_note: data.mwst_note || '',
          mwst_mode: ((data as any).mwst_mode === 'exclusive' ? 'exclusive' : 'none') as 'none' | 'exclusive',
        });
      }
    } catch (err: any) {
      console.error('Error fetching billing settings:', err);
      toast({ title: 'Fehler', description: 'Abrechnungseinstellungen konnten nicht geladen werden.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settingsId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('billing_settings')
        .update({
          company_name: form.company_name,
          company_legal_name: form.company_legal_name,
          company_street: form.company_street,
          company_zip: form.company_zip,
          company_city: form.company_city,
          company_country: form.company_country,
          company_email: form.company_email,
          company_phone: form.company_phone,
          company_website: form.company_website,
          mwst_number: form.mwst_number || null,
          mwst_rate: parseFloat(form.mwst_rate) || 0,
          mwst_note: form.mwst_note,
          mwst_mode: form.mwst_mode,
        } as any)
        .eq('id', settingsId);

      if (error) throw error;
      toast({ title: 'Gespeichert', description: 'Abrechnungseinstellungen wurden aktualisiert.' });
    } catch (err: any) {
      console.error('Error saving billing settings:', err);
      toast({ title: 'Fehler', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof BillingSettingsForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isMwstNone = form.mwst_mode === 'none';

  if (loading) {
    return (
      <AdminLayout title="Firmenangaben & Abrechnung">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Firmenangaben & Abrechnung">
      <div className="max-w-2xl space-y-6">
        {/* Company Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Firmendaten
            </CardTitle>
            <CardDescription>
              Diese Daten erscheinen auf Rechnungen, im Footer und auf den Rechtsseiten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Firmenname</Label>
                <Input id="company_name" value={form.company_name} onChange={e => updateField('company_name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_legal_name">Rechtlicher Name</Label>
                <Input id="company_legal_name" value={form.company_legal_name} onChange={e => updateField('company_legal_name', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_street">Strasse</Label>
              <Input id="company_street" value={form.company_street} onChange={e => updateField('company_street', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_zip">PLZ</Label>
                <Input id="company_zip" value={form.company_zip} onChange={e => updateField('company_zip', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_city">Ort</Label>
                <Input id="company_city" value={form.company_city} onChange={e => updateField('company_city', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="company_country">Land</Label>
                <Input id="company_country" value={form.company_country} onChange={e => updateField('company_country', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_email">E-Mail</Label>
                <Input id="company_email" type="email" value={form.company_email} onChange={e => updateField('company_email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_phone">Telefon</Label>
                <Input id="company_phone" value={form.company_phone} onChange={e => updateField('company_phone', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_website">Website</Label>
              <Input id="company_website" value={form.company_website} onChange={e => updateField('company_website', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle>MwSt-Einstellungen</CardTitle>
            <CardDescription>
              Steuermodus und Steuersatz für Rechnungen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mwst_mode">MwSt-Modus</Label>
              <Select value={form.mwst_mode} onValueChange={(v) => updateField('mwst_mode', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine MwSt — wird auf Rechnungen nicht ausgewiesen</SelectItem>
                  <SelectItem value="exclusive">Exklusiv — MwSt wird auf den Nettobetrag aufgeschlagen</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {isMwstNone
                  ? 'Rechnungen zeigen keine MwSt-Zeile. Betrag = Netto = Total.'
                  : 'MwSt wird separat auf der Rechnung ausgewiesen (Netto + MwSt = Total).'}
              </p>
            </div>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${isMwstNone ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="space-y-2">
                <Label htmlFor="mwst_number">MwSt-Nummer</Label>
                <Input id="mwst_number" value={form.mwst_number} onChange={e => updateField('mwst_number', e.target.value)} placeholder="z.B. CHE-123.456.789" disabled={isMwstNone} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mwst_rate">MwSt-Satz (%)</Label>
                <Input id="mwst_rate" type="number" step="0.1" min="0" max="100" value={form.mwst_rate} onChange={e => updateField('mwst_rate', e.target.value)} disabled={isMwstNone} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mwst_note">MwSt-Hinweis (auf Rechnungen)</Label>
              <Input id="mwst_note" value={form.mwst_note} onChange={e => updateField('mwst_note', e.target.value)} placeholder="z.B. MWST befreit (Liechtenstein)" />
              <p className="text-xs text-muted-foreground">
                {isMwstNone
                  ? 'Wird als kleine Notiz unter dem Total angezeigt.'
                  : 'Wird bei der MwSt-Zeile auf der Rechnung angezeigt.'}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Speichern
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminBillingSettings;
