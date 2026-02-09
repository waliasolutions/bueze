import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Circle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrayFieldEditor } from '@/components/admin/ArrayFieldEditor';

interface PageContent {
  id: string;
  page_key: string;
  content_type: string;
  fields: any;
  seo: any;
  status: string;
}

const ContentEditor = () => {
  const { pageKey } = useParams<{ pageKey: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isChecking, hasChecked, isAuthorized } = useAdminAuth();
  const [content, setContent] = useState<PageContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const initialContentRef = useRef<string>('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (pageKey && hasChecked && isAuthorized) {
      fetchContent();
    }
  }, [pageKey, hasChecked, isAuthorized]);

  // Track dirty state
  useEffect(() => {
    if (!content || !initialContentRef.current) return;
    const current = JSON.stringify({ fields: content.fields, seo: content.seo });
    setIsDirty(current !== initialContentRef.current);
  }, [content]);

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (isChecking && !hasChecked) return <PageSkeleton />;
  if (!isAuthorized) return null;

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .eq('page_key', pageKey)
        .single();

      if (error) throw error;
      setContent(data);
      initialContentRef.current = JSON.stringify({ fields: data.fields, seo: data.seo });
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!content) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('page_content')
        .update({
          fields: content.fields,
          seo: content.seo,
          status: content.status,
          updated_at: new Date().toISOString(),
        })
        .eq('page_key', pageKey);

      if (error) throw error;
      initialContentRef.current = JSON.stringify({ fields: content.fields, seo: content.seo });
      setIsDirty(false);
      toast({ title: 'Gespeichert', description: 'Änderungen wurden gespeichert.' });
    } catch (error: any) {
      toast({ title: 'Fehler beim Speichern', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path: string[], value: any) => {
    if (!content) return;
    const newFields = JSON.parse(JSON.stringify(content.fields || {}));
    let current = newFields;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    setContent({ ...content, fields: newFields });
  };

  const updateSeoField = (field: string, value: any) => {
    if (!content) return;
    setContent({ ...content, seo: { ...content.seo, [field]: value } });
  };

  if (loading) {
    return (
      <AdminLayout title="Content bearbeiten" description="Laden...">
        <div className="text-center py-12">Laden...</div>
      </AdminLayout>
    );
  }

  if (!content) {
    return (
      <AdminLayout title="Content bearbeiten" description="Inhalt nicht gefunden">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Inhalt nicht gefunden</p>
          <Button onClick={() => navigate('/admin/content')}>Zurück zur Übersicht</Button>
        </div>
      </AdminLayout>
    );
  }

  const getEditorTitle = () => {
    const titles: Record<string, string> = {
      homepage_hero: 'Hero-Bereich',
      homepage_how_it_works: 'So funktioniert es',
      homepage_faq: 'FAQ',
      homepage_footer: 'Footer',
    };
    return titles[content.page_key] || content.fields?.title || content.page_key;
  };

  const contentTypeLabel = content.content_type === 'category' ? 'Kategorie-Seite' :
                            content.content_type === 'homepage' ? 'Startseite' :
                            content.content_type === 'legal' ? 'Rechtliche Seite' : '';

  return (
    <AdminLayout title={getEditorTitle()} description={contentTypeLabel}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/content')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div className="flex items-center gap-3">
            {isDirty && (
              <span className="flex items-center gap-1.5 text-sm text-orange-600">
                <Circle className="w-2.5 h-2.5 fill-orange-500 text-orange-500" />
                Ungespeicherte Änderungen
              </span>
            )}
            <Button onClick={handleSave} disabled={saving || !isDirty}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList>
            <TabsTrigger value="content">Inhalt</TabsTrigger>
            {content.page_key !== 'homepage_footer' && (
              <TabsTrigger value="seo">SEO</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {/* Homepage Hero Editor */}
            {content.page_key === 'homepage_hero' && (
              <HomepageHeroEditor fields={content.fields} updateField={updateField} />
            )}

            {/* How It Works Editor */}
            {content.page_key === 'homepage_how_it_works' && (
              <HowItWorksEditor fields={content.fields} updateField={updateField} />
            )}

            {/* FAQ Editor */}
            {content.page_key === 'homepage_faq' && (
              <FAQEditor fields={content.fields} updateField={updateField} />
            )}

            {/* Footer Editor */}
            {content.page_key === 'homepage_footer' && (
              <FooterEditor fields={content.fields} updateField={updateField} />
            )}

            {/* Category Editor */}
            {content.content_type === 'category' && (
              <Card>
                <CardHeader><CardTitle>Kategorie-Inhalt</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Kategorie-Titel</Label>
                    <Input value={content.fields?.title || ''} onChange={(e) => updateField(['title'], e.target.value)} />
                  </div>
                  <div>
                    <Label>Beschreibung</Label>
                    <Textarea value={content.fields?.description || ''} onChange={(e) => updateField(['description'], e.target.value)} rows={4} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legal Editor */}
            {content.content_type === 'legal' && (
              <Card>
                <CardHeader><CardTitle>Rechtliche Seite</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Seitentitel</Label>
                    <Input value={content.fields?.title || ''} onChange={(e) => updateField(['title'], e.target.value)} />
                  </div>
                  <div>
                    <Label>Inhalt (HTML)</Label>
                    <Textarea value={content.fields?.content || ''} onChange={(e) => updateField(['content'], e.target.value)} rows={20} className="font-mono text-sm" />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {content.page_key !== 'homepage_footer' && (
            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>SEO Einstellungen</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Meta Titel</Label>
                    <Input value={content.seo?.title || content.seo?.meta_title || ''} onChange={(e) => updateSeoField('title', e.target.value)} maxLength={60} />
                    <p className="text-sm text-muted-foreground mt-1">{(content.seo?.title || content.seo?.meta_title || '').length}/60 Zeichen</p>
                  </div>
                  <div>
                    <Label>Meta Beschreibung</Label>
                    <Textarea value={content.seo?.description || content.seo?.meta_description || ''} onChange={(e) => updateSeoField('description', e.target.value)} maxLength={160} rows={3} />
                    <p className="text-sm text-muted-foreground mt-1">{(content.seo?.description || content.seo?.meta_description || '').length}/160 Zeichen</p>
                  </div>
                  <div>
                    <Label>Canonical URL</Label>
                    <Input value={content.seo?.canonical || content.seo?.canonical_url || ''} onChange={(e) => updateSeoField('canonical', e.target.value)} placeholder="https://bueeze.ch/..." />
                  </div>
                  <div>
                    <Label>Robots Meta</Label>
                    <Input value={content.seo?.robots || content.seo?.robots_meta || 'index,follow'} onChange={(e) => updateSeoField('robots', e.target.value)} />
                  </div>
                  <div>
                    <Label>Open Graph Bild URL</Label>
                    <Input value={content.seo?.og_image || ''} onChange={(e) => updateSeoField('og_image', e.target.value)} placeholder="https://..." />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

// ─── Sub-editors ───────────────────────────────────────────

function HomepageHeroEditor({ fields, updateField }: { fields: any; updateField: (path: string[], value: any) => void }) {
  const trustSignals: string[] = fields?.trustSignals || [];

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Hero-Bereich</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Haupttitel</Label>
            <Input value={fields?.title || ''} onChange={(e) => updateField(['title'], e.target.value)} />
          </div>
          <div>
            <Label>Titel Hervorhebung</Label>
            <Input value={fields?.titleHighlight || ''} onChange={(e) => updateField(['titleHighlight'], e.target.value)} />
          </div>
          <div>
            <Label>Untertitel</Label>
            <Textarea value={fields?.subtitle || ''} onChange={(e) => updateField(['subtitle'], e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Einleitungstext</Label>
            <Textarea value={fields?.subIntro || ''} onChange={(e) => updateField(['subIntro'], e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Badge-Text</Label>
            <Input value={fields?.badge || ''} onChange={(e) => updateField(['badge'], e.target.value)} />
          </div>
          <div>
            <Label>Call-to-Action Text</Label>
            <Input value={fields?.ctaText || ''} onChange={(e) => updateField(['ctaText'], e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Vertrauenssignale</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor<string>
            items={trustSignals}
            onUpdate={(items) => updateField(['trustSignals'], items)}
            addLabel="Signal hinzufügen"
            newItem={() => ''}
            maxItems={5}
            renderItem={(item, _index, onChange) => (
              <Input value={item} onChange={(e) => onChange(e.target.value)} placeholder="z.B. Geprüfte Fachbetriebe schweizweit" />
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}

function HowItWorksEditor({ fields, updateField }: { fields: any; updateField: (path: string[], value: any) => void }) {
  const steps: any[] = fields?.steps || [];

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Überschriften</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titel</Label>
            <Input value={fields?.title || ''} onChange={(e) => updateField(['title'], e.target.value)} />
          </div>
          <div>
            <Label>Untertitel</Label>
            <Input value={fields?.subtitle || ''} onChange={(e) => updateField(['subtitle'], e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Schritte</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor<{ title: string; description: string; highlight: string }>
            items={steps}
            onUpdate={(items) => updateField(['steps'], items)}
            addLabel="Schritt hinzufügen"
            newItem={() => ({ title: '', description: '', highlight: '' })}
            maxItems={6}
            collapsibleLabel={(item, i) => `Schritt ${i + 1}: ${item.title || '(leer)'}`}
            renderItem={(item, _index, onChange) => (
              <div className="space-y-3">
                <div>
                  <Label>Titel</Label>
                  <Input value={item.title} onChange={(e) => onChange({ ...item, title: e.target.value })} />
                </div>
                <div>
                  <Label>Beschreibung</Label>
                  <Textarea value={item.description} onChange={(e) => onChange({ ...item, description: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label>Hervorhebung (optional)</Label>
                  <Input value={item.highlight || ''} onChange={(e) => onChange({ ...item, highlight: e.target.value })} placeholder="z.B. Kostenlos & unverbindlich." />
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}

function FAQEditor({ fields, updateField }: { fields: any; updateField: (path: string[], value: any) => void }) {
  const categories: any[] = fields?.categories || [];

  const updateCategories = (newCategories: any[]) => {
    updateField(['categories'], newCategories);
  };

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Überschriften</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Titel</Label>
            <Input value={fields?.title || ''} onChange={(e) => updateField(['title'], e.target.value)} />
          </div>
          <div>
            <Label>Untertitel</Label>
            <Input value={fields?.subtitle || ''} onChange={(e) => updateField(['subtitle'], e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>FAQ-Kategorien</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor<{ category: string; questions: { q: string; a: string }[] }>
            items={categories}
            onUpdate={updateCategories}
            addLabel="Kategorie hinzufügen"
            newItem={() => ({ category: '', questions: [{ q: '', a: '' }] })}
            collapsibleLabel={(item) => item.category || '(Neue Kategorie)'}
            renderItem={(cat, _catIdx, onCatChange) => (
              <div className="space-y-4">
                <div>
                  <Label>Kategoriename</Label>
                  <Input value={cat.category} onChange={(e) => onCatChange({ ...cat, category: e.target.value })} />
                </div>
                <div>
                  <Label className="mb-2 block">Fragen</Label>
                  <ArrayFieldEditor<{ q: string; a: string }>
                    items={cat.questions || []}
                    onUpdate={(questions) => onCatChange({ ...cat, questions })}
                    addLabel="Frage hinzufügen"
                    newItem={() => ({ q: '', a: '' })}
                    collapsibleLabel={(item) => item.q || '(Neue Frage)'}
                    renderItem={(qa, _qIdx, onQaChange) => (
                      <div className="space-y-2">
                        <div>
                          <Label>Frage</Label>
                          <Input value={qa.q} onChange={(e) => onQaChange({ ...qa, q: e.target.value })} />
                        </div>
                        <div>
                          <Label>Antwort</Label>
                          <Textarea value={qa.a} onChange={(e) => onQaChange({ ...qa, a: e.target.value })} rows={4} />
                        </div>
                      </div>
                    )}
                  />
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}

function FooterEditor({ fields, updateField }: { fields: any; updateField: (path: string[], value: any) => void }) {
  const quickLinks: any[] = fields?.quickLinks || [];

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Firmen-Informationen</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Firmenbeschreibung</Label>
            <Textarea value={fields?.companyDescription || ''} onChange={(e) => updateField(['companyDescription'], e.target.value)} rows={3} />
          </div>
          <div>
            <Label>E-Mail</Label>
            <Input value={fields?.email || ''} onChange={(e) => updateField(['email'], e.target.value)} type="email" />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input value={fields?.phone || ''} onChange={(e) => updateField(['phone'], e.target.value)} />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input value={fields?.address || ''} onChange={(e) => updateField(['address'], e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Social Media</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Facebook URL</Label>
            <Input value={fields?.socialLinks?.facebook || ''} onChange={(e) => updateField(['socialLinks', 'facebook'], e.target.value)} placeholder="https://facebook.com/..." />
          </div>
          <div>
            <Label>Instagram URL</Label>
            <Input value={fields?.socialLinks?.instagram || ''} onChange={(e) => updateField(['socialLinks', 'instagram'], e.target.value)} placeholder="https://instagram.com/..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
        <CardContent>
          <ArrayFieldEditor<{ label: string; href: string }>
            items={quickLinks}
            onUpdate={(items) => updateField(['quickLinks'], items)}
            addLabel="Link hinzufügen"
            newItem={() => ({ label: '', href: '' })}
            maxItems={10}
            renderItem={(item, _index, onChange) => (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Bezeichnung</Label>
                  <Input value={item.label} onChange={(e) => onChange({ ...item, label: e.target.value })} placeholder="z.B. AGB" />
                </div>
                <div>
                  <Label>Pfad</Label>
                  <Input value={item.href} onChange={(e) => onChange({ ...item, href: e.target.value })} placeholder="/legal/agb" />
                </div>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}

export default ContentEditor;
