import React, { useState, useEffect } from 'react';
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
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

  useEffect(() => {
    if (pageKey && hasChecked && isAuthorized) {
      fetchContent();
    }
  }, [pageKey, hasChecked, isAuthorized]);

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
    } catch (error: any) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
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

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Die Änderungen wurden erfolgreich gespeichert.',
      });
    } catch (error: any) {
      toast({
        title: 'Fehler beim Speichern',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (path: string[], value: any) => {
    if (!content) return;

    const newContent = { ...content };
    let current: any = newContent.fields;

    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setContent(newContent);
  };

  const updateSeoField = (field: string, value: any) => {
    if (!content) return;
    setContent({
      ...content,
      seo: {
        ...content.seo,
        [field]: value,
      },
    });
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

  const contentTypeLabel = content.content_type === 'category' ? 'Kategorie-Seite' :
                           content.content_type === 'homepage' ? 'Startseite' :
                           content.content_type === 'legal' ? 'Rechtliche Seite' : '';

  return (
    <AdminLayout title={content.fields?.title || content.page_key} description={contentTypeLabel}>
      <div className="max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/content')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
            <TabsList>
              <TabsTrigger value="content">Inhalt</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Seiten-Inhalt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {content.content_type === 'homepage' && (
                    <>
                      <div>
                        <Label htmlFor="title">Haupttitel</Label>
                        <Input
                          id="title"
                          value={content.fields?.title || ''}
                          onChange={(e) => updateField(['title'], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="titleHighlight">Titel Hervorhebung</Label>
                        <Input
                          id="titleHighlight"
                          value={content.fields?.titleHighlight || ''}
                          onChange={(e) => updateField(['titleHighlight'], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="subtitle">Untertitel</Label>
                        <Textarea
                          id="subtitle"
                          value={content.fields?.subtitle || ''}
                          onChange={(e) => updateField(['subtitle'], e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ctaText">Call-to-Action Text</Label>
                        <Input
                          id="ctaText"
                          value={content.fields?.ctaText || ''}
                          onChange={(e) => updateField(['ctaText'], e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  {content.content_type === 'category' && (
                    <>
                      <div>
                        <Label htmlFor="title">Kategorie-Titel</Label>
                        <Input
                          id="title"
                          value={content.fields?.title || ''}
                          onChange={(e) => updateField(['title'], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Beschreibung</Label>
                        <Textarea
                          id="description"
                          value={content.fields?.description || ''}
                          onChange={(e) => updateField(['description'], e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div>
                        <Label>Services & FAQ</Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Erweiterte Bearbeitung von Services und FAQ kommt in Phase 2
                        </p>
                      </div>
                    </>
                  )}

                  {content.content_type === 'legal' && (
                    <>
                      <div>
                        <Label htmlFor="title">Seitentitel</Label>
                        <Input
                          id="title"
                          value={content.fields?.title || ''}
                          onChange={(e) => updateField(['title'], e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="content">Inhalt (HTML)</Label>
                        <Textarea
                          id="content"
                          value={content.fields?.content || ''}
                          onChange={(e) => updateField(['content'], e.target.value)}
                          rows={20}
                          className="font-mono text-sm"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Rich-Text-Editor kommt in Phase 2
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seo" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>SEO Einstellungen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Meta Titel</Label>
                    <Input
                      id="title"
                      value={content.seo?.title || content.seo?.meta_title || ''}
                      onChange={(e) => updateSeoField('title', e.target.value)}
                      maxLength={60}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {(content.seo?.title || content.seo?.meta_title || '').length}/60 Zeichen
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="description">Meta Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={content.seo?.description || content.seo?.meta_description || ''}
                      onChange={(e) => updateSeoField('description', e.target.value)}
                      maxLength={160}
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {(content.seo?.description || content.seo?.meta_description || '').length}/160 Zeichen
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="canonical">Canonical URL</Label>
                    <Input
                      id="canonical"
                      value={content.seo?.canonical || content.seo?.canonical_url || ''}
                      onChange={(e) => updateSeoField('canonical', e.target.value)}
                      placeholder="https://bueeze.ch/..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="robots">Robots Meta</Label>
                    <Input
                      id="robots"
                      value={content.seo?.robots || content.seo?.robots_meta || 'index,follow'}
                      onChange={(e) => updateSeoField('robots', e.target.value)}
                      placeholder="index,follow"
                    />
                  </div>
                  <div>
                    <Label htmlFor="og_image">Open Graph Bild URL</Label>
                    <Input
                      id="og_image"
                      value={content.seo?.og_image || ''}
                      onChange={(e) => updateSeoField('og_image', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </AdminLayout>
  );
};

export default ContentEditor;
