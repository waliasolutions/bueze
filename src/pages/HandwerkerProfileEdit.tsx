import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Save, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HandwerkerProfile {
  id: string;
  bio: string | null;
  hourly_rate_min: number | null;
  hourly_rate_max: number | null;
  service_areas: string[];
  portfolio_urls: string[];
  website: string | null;
  phone_number: string | null;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
}

const HandwerkerProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<HandwerkerProfile | null>(null);
  const [bio, setBio] = useState('');
  const [hourlyRateMin, setHourlyRateMin] = useState('');
  const [hourlyRateMax, setHourlyRateMax] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');
  const [website, setWebsite] = useState('');
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);

  useEffect(() => {
    checkAccessAndLoadProfile();
  }, []);

  const checkAccessAndLoadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Nicht angemeldet',
          description: 'Bitte melden Sie sich an.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Check if user is an approved handwerker
      const { data: profileData, error } = await supabase
        .from('handwerker_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('verification_status', 'approved')
        .maybeSingle();

      if (error) throw error;

      if (!profileData) {
        toast({
          title: 'Zugriff verweigert',
          description: 'Nur freigeschaltete Handwerker können ihr Profil bearbeiten.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setProfile(profileData);
      setBio(profileData.bio || '');
      setHourlyRateMin(profileData.hourly_rate_min?.toString() || '');
      setHourlyRateMax(profileData.hourly_rate_max?.toString() || '');
      setServiceAreas(profileData.service_areas?.join(', ') || '');
      setWebsite(profileData.website || '');
      setPortfolioUrls(profileData.portfolio_urls || []);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Fehler',
        description: 'Profil konnte nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !profile) return;

    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const file of Array.from(files)) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Ungültiger Dateityp',
            description: `${file.name} ist keine Bilddatei.`,
            variant: 'destructive',
          });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Datei zu groß',
            description: `${file.name} ist größer als 5MB.`,
            variant: 'destructive',
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('handwerker-portfolio')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('handwerker-portfolio')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      setPortfolioUrls([...portfolioUrls, ...uploadedUrls]);
      
      toast({
        title: 'Upload erfolgreich',
        description: `${uploadedUrls.length} Bild(er) hochgeladen.`,
      });
    } catch (error: any) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload fehlgeschlagen',
        description: error.message || 'Bilder konnten nicht hochgeladen werden.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleRemoveImage = async (url: string) => {
    try {
      // Extract file path from URL
      const urlParts = url.split('/handwerker-portfolio/');
      if (urlParts.length === 2) {
        const filePath = urlParts[1].split('?')[0];
        
        const { error } = await supabase.storage
          .from('handwerker-portfolio')
          .remove([filePath]);

        if (error) throw error;
      }

      setPortfolioUrls(portfolioUrls.filter(u => u !== url));
      
      toast({
        title: 'Bild entfernt',
        description: 'Das Bild wurde aus Ihrem Portfolio entfernt.',
      });
    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        title: 'Fehler',
        description: 'Bild konnte nicht entfernt werden.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    // Validation
    if (hourlyRateMin && hourlyRateMax) {
      const min = parseInt(hourlyRateMin);
      const max = parseInt(hourlyRateMax);
      if (min > max) {
        toast({
          title: 'Ungültige Eingabe',
          description: 'Der minimale Stundensatz darf nicht höher als der maximale sein.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    try {
      const serviceAreasArray = serviceAreas
        .split(',')
        .map(area => area.trim())
        .filter(area => area.length > 0);

      const { error } = await supabase
        .from('handwerker_profiles')
        .update({
          bio: bio.trim() || null,
          hourly_rate_min: hourlyRateMin ? parseInt(hourlyRateMin) : null,
          hourly_rate_max: hourlyRateMax ? parseInt(hourlyRateMax) : null,
          service_areas: serviceAreasArray,
          website: website.trim() || null,
          portfolio_urls: portfolioUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Profil gespeichert',
        description: 'Ihre Änderungen wurden erfolgreich gespeichert.',
      });

      // Reload profile
      await checkAccessAndLoadProfile();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Fehler beim Speichern',
        description: error.message || 'Profil konnte nicht gespeichert werden.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/handwerker-dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zum Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-ink-900 mb-2">
              Profil bearbeiten
            </h1>
            <p className="text-ink-600">
              {profile.first_name} {profile.last_name}
              {profile.company_name && ` • ${profile.company_name}`}
            </p>
          </div>

          <div className="space-y-6">
            {/* Bio Section */}
            <Card>
              <CardHeader>
                <CardTitle>Über mich</CardTitle>
                <CardDescription>
                  Beschreiben Sie Ihre Erfahrung und Expertise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="bio">Biografie</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Erzählen Sie potentiellen Kunden über Ihre Erfahrung, Spezialisierungen und was Sie auszeichnet..."
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-sm text-muted-foreground">
                    {bio.length} / 1000 Zeichen
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Rates Section */}
            <Card>
              <CardHeader>
                <CardTitle>Stundensätze</CardTitle>
                <CardDescription>
                  Geben Sie Ihre Preisspanne an (in CHF pro Stunde)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate_min">Minimaler Stundensatz (CHF)</Label>
                    <Input
                      id="hourly_rate_min"
                      type="number"
                      min="0"
                      step="5"
                      value={hourlyRateMin}
                      onChange={(e) => setHourlyRateMin(e.target.value)}
                      placeholder="z.B. 50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate_max">Maximaler Stundensatz (CHF)</Label>
                    <Input
                      id="hourly_rate_max"
                      type="number"
                      min="0"
                      step="5"
                      value={hourlyRateMax}
                      onChange={(e) => setHourlyRateMax(e.target.value)}
                      placeholder="z.B. 120"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Service Areas Section */}
            <Card>
              <CardHeader>
                <CardTitle>Servicegebiete</CardTitle>
                <CardDescription>
                  Geben Sie die Orte oder Postleitzahlen an, in denen Sie arbeiten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="service_areas">Servicegebiete</Label>
                  <Input
                    id="service_areas"
                    value={serviceAreas}
                    onChange={(e) => setServiceAreas(e.target.value)}
                    placeholder="z.B. Zürich, 8000, Winterthur, 8400"
                  />
                  <p className="text-sm text-muted-foreground">
                    Trennen Sie mehrere Gebiete durch Komma
                  </p>
                  {serviceAreas && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {serviceAreas.split(',').map((area, idx) => (
                        <Badge key={idx} variant="secondary">
                          {area.trim()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Website Section */}
            <Card>
              <CardHeader>
                <CardTitle>Website</CardTitle>
                <CardDescription>
                  Link zu Ihrer persönlichen oder Firmen-Website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.ihre-website.ch"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Portfolio Section */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio-Bilder</CardTitle>
                <CardDescription>
                  Zeigen Sie Ihre besten Arbeiten (max. 5MB pro Bild)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="portfolio_upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-brand-600 transition-colors">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mb-1">
                          Klicken Sie hier, um Bilder hochzuladen
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, WEBP bis zu 5MB
                        </p>
                      </div>
                    </Label>
                    <Input
                      id="portfolio_upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </div>

                  {uploading && (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-brand-600 mr-2" />
                      <span className="text-sm text-muted-foreground">
                        Bilder werden hochgeladen...
                      </span>
                    </div>
                  )}

                  {portfolioUrls.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {portfolioUrls.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Portfolio ${idx + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => handleRemoveImage(url)}
                            className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/handwerker-dashboard')}
                disabled={saving}
              >
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Speichert...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Änderungen speichern
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default HandwerkerProfileEdit;
