import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Globe, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function SEOTools() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [robotsTxt, setRobotsTxt] = useState('');
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    fetchSEOSettings();
  }, []);

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

      // Update last generated timestamp
      if (settingsId) {
        await supabase
          .from('site_seo_settings')
          .update({ sitemap_last_generated: new Date().toISOString() })
          .eq('id', settingsId);
      }

      setLastGenerated(new Date().toISOString());

      toast({
        title: 'Sitemap generiert',
        description: 'Die Sitemap wurde erfolgreich erstellt',
      });
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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">SEO Tools</h1>
            <p className="text-muted-foreground">Sitemap und Robots.txt verwalten</p>
          </div>
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
              <p className="text-sm text-muted-foreground">
                Die Sitemap wird unter <code className="bg-muted px-2 py-1 rounded">/sitemap.xml</code> verfügbar sein
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
      </div>
    </div>
  );
}
