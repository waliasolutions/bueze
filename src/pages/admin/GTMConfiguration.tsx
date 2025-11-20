import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { ArrowLeft, Save, Shield, Code } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function GTMConfiguration() {
  const navigate = useNavigate();
  const { settings, loading, updateSettings } = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    gtm_container_id: '',
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        gtm_container_id: settings.gtm_container_id || '',
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
          <h1 className="text-3xl font-bold text-foreground">GTM Configuration</h1>
          <p className="text-muted-foreground">Configure Google Tag Manager container ID</p>
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
              Format: GTM-XXXXXXX. Get this from your Google Tag Manager account.
            </p>
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
