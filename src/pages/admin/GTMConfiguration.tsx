import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { ArrowLeft, Save, Shield, Code, BarChart3, Globe } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function GTMConfiguration() {
  const navigate = useNavigate();
  const { settings, loading, updateSettings } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    gtm_container_id: '',
    google_analytics_id: '',
    google_search_console_verification: '',
    default_meta_title: '',
    default_meta_description: '',
    default_og_image: '',
    site_name: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        gtm_container_id: settings.gtm_container_id || '',
        google_analytics_id: settings.google_analytics_id || '',
        google_search_console_verification: settings.google_search_console_verification || '',
        default_meta_title: settings.default_meta_title || '',
        default_meta_description: settings.default_meta_description || '',
        default_og_image: settings.default_og_image || '',
        site_name: settings.site_name || '',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateSettings(formData);
      if (result.success) {
        toast.success('GTM configuration saved successfully. Refresh the page to see changes.');
      } else {
        toast.error('Failed to save: ' + result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Loading configuration...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/seo')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">GTM & Analytics Configuration</h1>
          <p className="text-muted-foreground">Manage tracking and default meta tags</p>
        </div>
      </div>

      <Alert className="border-brand-500 bg-pastel-blue-50">
        <Shield className="h-4 w-4" />
        <AlertTitle>Security-First Approach</AlertTitle>
        <AlertDescription>
          This configuration uses Google Tag Manager for all tracking and third-party scripts. 
          No custom code injection is allowed to maintain security and prevent XSS vulnerabilities.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-brand-500" />
              Google Tag Manager
            </CardTitle>
            <CardDescription>
              Configure GTM container for all tracking events and third-party scripts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gtm">GTM Container ID</Label>
              <Input
                id="gtm"
                placeholder="GTM-XXXXXXX"
                value={formData.gtm_container_id}
                onChange={(e) => setFormData({ ...formData, gtm_container_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Find this in your Google Tag Manager account
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-500" />
              Google Analytics
            </CardTitle>
            <CardDescription>
              Configure GA4 property for analytics tracking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ga4">GA4 Measurement ID</Label>
              <Input
                id="ga4"
                placeholder="G-XXXXXXXXXX"
                value={formData.google_analytics_id}
                onChange={(e) => setFormData({ ...formData, google_analytics_id: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Configure this in GTM or enter directly here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-500" />
            Search Console Verification
          </CardTitle>
          <CardDescription>
            Google Search Console site verification code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gsc">Verification Code</Label>
            <Input
              id="gsc"
              placeholder="google1234567890abcdef.html or verification code"
              value={formData.google_search_console_verification}
              onChange={(e) => setFormData({ ...formData, google_search_console_verification: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Get this from Google Search Console → Settings → Ownership verification
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Meta Tags</CardTitle>
          <CardDescription>
            Fallback meta tags used when pages don't have specific values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="site-name">Site Name</Label>
            <Input
              id="site-name"
              placeholder="Büeze.ch"
              value={formData.site_name}
              onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-title">Default Meta Title</Label>
            <Input
              id="default-title"
              placeholder="Büeze.ch - Geprüfte Handwerker in der Schweiz finden"
              value={formData.default_meta_title}
              onChange={(e) => setFormData({ ...formData, default_meta_title: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Max 60 characters recommended</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-desc">Default Meta Description</Label>
            <Textarea
              id="default-desc"
              placeholder="Finden Sie qualifizierte und geprüfte Handwerker in Ihrer Region..."
              value={formData.default_meta_description}
              onChange={(e) => setFormData({ ...formData, default_meta_description: e.target.value })}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">Max 160 characters recommended</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="default-og">Default OG Image URL</Label>
            <Input
              id="default-og"
              placeholder="https://bueeze.ch/og-image.jpg"
              value={formData.default_og_image}
              onChange={(e) => setFormData({ ...formData, default_og_image: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Used for social media sharing</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate('/admin/seo')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
