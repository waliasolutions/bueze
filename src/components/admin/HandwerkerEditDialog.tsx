import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { SWISS_CANTONS } from '@/config/cantons';
import { majorCategories } from '@/config/majorCategories';
import { subcategoryLabels } from '@/config/subcategoryLabels';
import { Loader2, ChevronDown } from 'lucide-react';

interface HandwerkerEditData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  company_name: string | null;
  business_address: string | null;
  business_zip: string | null;
  business_city: string | null;
  business_canton: string | null;
  categories: string[];
}

interface HandwerkerEditDialogProps {
  handwerker: HandwerkerEditData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function HandwerkerEditDialog({ handwerker, open, onOpenChange, onSaved }: HandwerkerEditDialogProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<HandwerkerEditData | null>(null);

  const activeForm = form ?? handwerker;

  const handleOpen = (isOpen: boolean) => {
    if (isOpen && handwerker) {
      setForm({ ...handwerker, categories: [...(handwerker.categories || [])] });
    } else {
      setForm(null);
    }
    onOpenChange(isOpen);
  };

  const updateField = (field: keyof HandwerkerEditData, value: string) => {
    if (!activeForm) return;
    setForm({ ...activeForm, [field]: value || null });
  };

  const toggleCategory = (cat: string) => {
    if (!activeForm) return;
    const cats = activeForm.categories || [];
    const updated = cats.includes(cat)
      ? cats.filter(c => c !== cat)
      : [...cats, cat];
    setForm({ ...activeForm, categories: updated });
  };

  const toggleMajorCategory = (majorId: string) => {
    if (!activeForm) return;
    const major = majorCategories[majorId];
    if (!major) return;
    const cats = activeForm.categories || [];
    const allSelected = major.subcategories.every(s => cats.includes(s));
    const updated = allSelected
      ? cats.filter(c => !major.subcategories.includes(c))
      : [...new Set([...cats, ...major.subcategories])];
    setForm({ ...activeForm, categories: updated });
  };

  const handleSave = async () => {
    if (!activeForm) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('handwerker_profiles')
        .update({
          first_name: activeForm.first_name,
          last_name: activeForm.last_name,
          email: activeForm.email,
          phone_number: activeForm.phone_number,
          company_name: activeForm.company_name,
          business_address: activeForm.business_address,
          business_zip: activeForm.business_zip,
          business_city: activeForm.business_city,
          business_canton: activeForm.business_canton,
          categories: activeForm.categories as any,
        })
        .eq('id', activeForm.id);

      if (error) throw error;

      toast({ title: 'Handwerker aktualisiert' });
      onSaved();
      onOpenChange(false);
      setForm(null);
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!activeForm) return null;

  const currentCats = activeForm.categories || [];

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Handwerker bearbeiten</DialogTitle>
          <DialogDescription>Kontakt-, Adress- und Kategoriedaten bearbeiten</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contact Section */}
          <p className="text-sm font-semibold text-muted-foreground">Kontakt</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-first-name">Vorname</Label>
              <Input id="edit-first-name" value={activeForm.first_name || ''} onChange={(e) => updateField('first_name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-last-name">Nachname</Label>
              <Input id="edit-last-name" value={activeForm.last_name || ''} onChange={(e) => updateField('last_name', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-company">Firma</Label>
            <Input id="edit-company" value={activeForm.company_name || ''} onChange={(e) => updateField('company_name', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-email">E-Mail</Label>
            <Input id="edit-email" type="email" value={activeForm.email || ''} onChange={(e) => updateField('email', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="edit-phone">Telefon</Label>
            <Input id="edit-phone" value={activeForm.phone_number || ''} onChange={(e) => updateField('phone_number', e.target.value)} />
          </div>

          {/* Address Section */}
          <p className="text-sm font-semibold text-muted-foreground pt-2">Geschäftsadresse</p>
          <div className="space-y-1">
            <Label htmlFor="edit-address">Strasse</Label>
            <Input id="edit-address" value={activeForm.business_address || ''} onChange={(e) => updateField('business_address', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-zip">PLZ</Label>
              <Input id="edit-zip" value={activeForm.business_zip || ''} onChange={(e) => updateField('business_zip', e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label htmlFor="edit-city">Ort</Label>
              <Input id="edit-city" value={activeForm.business_city || ''} onChange={(e) => updateField('business_city', e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Kanton</Label>
            <Select value={activeForm.business_canton || ''} onValueChange={(v) => updateField('business_canton', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Kanton wählen" />
              </SelectTrigger>
              <SelectContent>
                {SWISS_CANTONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categories Section */}
          <p className="text-sm font-semibold text-muted-foreground pt-2">Kategorien ({currentCats.length} ausgewählt)</p>
          <div className="space-y-1 border rounded-md p-2">
            {Object.values(majorCategories).map((major) => {
              const selectedCount = major.subcategories.filter(s => currentCats.includes(s)).length;
              const allSelected = major.subcategories.length > 0 && selectedCount === major.subcategories.length;

              return (
                <Collapsible key={major.id}>
                  <div className="flex items-center gap-2 py-1.5 px-1">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => toggleMajorCategory(major.id)}
                      aria-label={`Alle ${major.label} auswählen`}
                    />
                    <CollapsibleTrigger className="flex items-center gap-1 flex-1 text-sm font-medium hover:underline">
                      {major.label}
                      {selectedCount > 0 && (
                        <span className="text-xs text-muted-foreground">({selectedCount})</span>
                      )}
                      <ChevronDown className="h-3.5 w-3.5 ml-auto shrink-0 transition-transform duration-200" />
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pl-7 pb-2">
                      {major.subcategories.map((sub) => {
                        const info = subcategoryLabels[sub];
                        return (
                          <label key={sub} className="flex items-center gap-1.5 text-xs cursor-pointer">
                            <Checkbox
                              checked={currentCats.includes(sub)}
                              onCheckedChange={() => toggleCategory(sub)}
                              className="h-3.5 w-3.5"
                            />
                            {info?.label || sub}
                          </label>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Abbrechen</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
