import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminGuard } from '@/hooks/useAuthGuard';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Globe, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function SEOTools() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { loading: authLoading, isAuthorized } = useAdminGuard();
  const [robotsTxt, setRobotsTxt] = useState('');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [sitemapUrl, setSitemapUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthorized) {
      fetchSEOSettings();
    }
  }, [isAuthorized]);

  if (authLoading) return <PageSkeleton />;
  if (!isAuthorized) return null;

  const fetchSEOSettings = async () => {
    const { data, error } = await supabase
      .from('site_seo_settings')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching SEO settings:', error);
      return;
    }

    if (data) {
      setRobotsTxt(data.robots_txt);
      setLastGenerated(data.sitemap_last_generated);
      setSettingsId(data.id);
    }
  };

  const handleSaveRobotsTxt = async () => {
    if (!settingsId) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('site_seo_settings')
      .update({ 
        robots_txt: robotsTxt,
        updated_at: new Date().toISOString(),
        updated_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', settingsId);

    setIsSaving(false);

    if (error) {
      toast({
        title: 'Fehler',
        description: 'Robots.txt konnte nicht gespeichert werden',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Gespeichert',
      description: 'Robots.txt wurde erfolgreich aktualisiert',
    });
  };

  const handleGenerateSitemap = async () => {
    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-sitemap');

      if (error) throw error;

      // The edge function now returns JSON with url and timestamp
      if (data?.url) {
        setSitemapUrl(data.url);
      }

      if (data?.timestamp) {
        setLastGenerated(data.timestamp);
      }

      toast({
        title: 'Sitemap generiert',
        description: 'Die Sitemap wurde erfolgreich erstellt und ist verfügbar',
      });

      // Refresh settings to get updated timestamp
      fetchSEOSettings();
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast({
        title: 'Fehler',
        description: 'Sitemap konnte nicht generiert werden',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AdminLayout title="SEO Tools" description="Manage your site's SEO settings">
      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card className="cursor-pointer hover:border-brand-500 transition-colors" onClick={() => navigate('/admin/seo/bulk-meta')}>
            <CardHeader>
              <CardTitle className="text-lg">Bulk Meta Management</CardTitle>
              <CardDescription>Manage meta tags for all pages and site-wide defaults</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:border-brand-500 transition-colors" onClick={() => navigate('/admin/seo/gtm')}>
            <CardHeader>
              <CardTitle className="text-lg">GTM Configuration</CardTitle>
              <CardDescription>Configure Google Tag Manager container ID for tracking</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="cursor-pointer hover:border-brand-500 transition-colors">
            <CardHeader>
              <CardTitle className="text-lg">SEO Health</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Sitemap Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Sitemap Generator
              </CardTitle>
              <CardDescription>
                XML-Sitemap für Suchmaschinen generieren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Letzte Generierung:</p>
                  <p className="text-sm text-muted-foreground">
                    {lastGenerated
                      ? new Date(lastGenerated).toLocaleString('de-CH')
                      : 'Noch nie generiert'}
                  </p>
                </div>
                <Button onClick={handleGenerateSitemap} disabled={isGenerating}>
                  {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sitemap generieren
                </Button>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Die Sitemap ist verfügbar unter:
                </p>
                <div className="flex gap-2">
                  <code className="bg-muted px-3 py-2 rounded flex-1 text-sm">
                    https://bueeze.ch/sitemap.xml
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://bueeze.ch/sitemap.xml', '_blank')}
                  >
                    Öffnen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Robots.txt Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Robots.txt Editor
              </CardTitle>
              <CardDescription>
                Anweisungen für Suchmaschinen-Crawler
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={robotsTxt}
                onChange={(e) => setRobotsTxt(e.target.value)}
                placeholder="User-agent: *&#10;Allow: /"
                className="font-mono text-sm min-h-[300px]"
              />
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Wird unter <code className="bg-muted px-2 py-1 rounded">/robots.txt</code> verfügbar sein
                </p>
                <Button onClick={handleSaveRobotsTxt} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
    </AdminLayout>
  );
}
