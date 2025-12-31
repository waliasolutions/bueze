import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Globe, Loader2, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SEOTools() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isChecking, hasChecked, isAuthorized } = useAdminAuth();
  const [robotsTxt, setRobotsTxt] = useState('');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [sitemapUrl, setSitemapUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmittingToIndex, setIsSubmittingToIndex] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [indexableUrls, setIndexableUrls] = useState<string[]>([]);
  const [indexingResults, setIndexingResults] = useState<{
    success: boolean;
    successCount?: number;
    failCount?: number;
    message?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (hasChecked && isAuthorized) {
      fetchSEOSettings();
    }
  }, [hasChecked, isAuthorized]);

  if (isChecking && !hasChecked) return <PageSkeleton />;
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

      if (data?.url) {
        setSitemapUrl(data.url);
      }

      if (data?.timestamp) {
        setLastGenerated(data.timestamp);
      }

      if (data?.indexableUrls) {
        setIndexableUrls(data.indexableUrls);
      }

      toast({
        title: 'Sitemap generiert',
        description: `${data?.urlCount || 0} URLs in der Sitemap`,
      });

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

  const handleSubmitToIndexing = async () => {
    setIsSubmittingToIndex(true);
    setIndexingResults(null);

    try {
      // First generate sitemap to get all URLs
      let urlsToSubmit = indexableUrls;
      
      if (urlsToSubmit.length === 0) {
        const { data: sitemapData, error: sitemapError } = await supabase.functions.invoke('generate-sitemap');
        if (sitemapError) throw sitemapError;
        urlsToSubmit = sitemapData?.indexableUrls || [];
        setIndexableUrls(urlsToSubmit);
      }

      if (urlsToSubmit.length === 0) {
        throw new Error('Keine URLs zum Indexieren gefunden');
      }

      // Submit to Google Indexing API
      const { data, error } = await supabase.functions.invoke('submit-to-indexing', {
        body: { urls: urlsToSubmit }
      });

      if (error) throw error;

      setIndexingResults(data);

      if (data?.success) {
        toast({
          title: 'Indexierung gestartet',
          description: `${data.successCount} URLs erfolgreich an Google gesendet`,
        });
      } else {
        toast({
          title: 'Fehler bei Indexierung',
          description: data?.error || 'Unbekannter Fehler',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error submitting to indexing:', error);
      setIndexingResults({
        success: false,
        error: error.message || 'Fehler bei der Indexierung'
      });
      toast({
        title: 'Fehler',
        description: error.message || 'URLs konnten nicht zur Indexierung gesendet werden',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingToIndex(false);
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

          {/* Google Indexing API */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Google Indexing API
              </CardTitle>
              <CardDescription>
                URLs zur sofortigen Indexierung an Google Search Console senden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Voraussetzungen</AlertTitle>
                <AlertDescription className="text-sm">
                  Für die Nutzung der Google Indexing API benötigen Sie:
                  <ul className="list-disc ml-4 mt-2 space-y-1">
                    <li>Ein Google Cloud Projekt mit aktivierter Indexing API</li>
                    <li>Ein Service Account mit den richtigen Berechtigungen</li>
                    <li>Den Service Account als Inhaber in der Search Console hinzugefügt</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleSubmitToIndexing} 
                  disabled={isSubmittingToIndex}
                  className="flex-1"
                >
                  {isSubmittingToIndex && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Alle öffentlichen Seiten indexieren
                </Button>
                
                {indexableUrls.length > 0 && (
                  <Badge variant="secondary" className="self-center">
                    {indexableUrls.length} URLs verfügbar
                  </Badge>
                )}
              </div>

              {/* Indexing Results */}
              {indexingResults && (
                <div className={`p-4 rounded-lg border ${indexingResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {indexingResults.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-medium ${indexingResults.success ? 'text-green-800' : 'text-red-800'}`}>
                      {indexingResults.success ? 'Indexierung erfolgreich' : 'Fehler bei Indexierung'}
                    </span>
                  </div>
                  {indexingResults.success ? (
                    <p className="text-sm text-green-700">
                      {indexingResults.successCount} URLs erfolgreich gesendet, {indexingResults.failCount} fehlgeschlagen
                    </p>
                  ) : (
                    <p className="text-sm text-red-700">
                      {indexingResults.error || indexingResults.message}
                    </p>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Die Google Indexing API hat ein Tageslimit von 200 Anfragen. URLs werden priorisiert gecrawlt, 
                aber die sofortige Indexierung ist nicht garantiert.
              </p>
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
