import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminGuard } from '@/hooks/useAuthGuard';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { toast } from 'sonner';
import { Save, Shield, Code } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function GTMConfiguration() {
  const navigate = useNavigate();
  const { settings, loading, updateSettings } = useSiteSettings();
  const { loading: authLoading, isAuthorized } = useAdminGuard();
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

  if (authLoading) return <PageSkeleton />;
  if (!isAuthorized) return null;

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
      <AdminLayout title="GTM Configuration" description="Configure Google Tag Manager container ID">
        <p className="text-muted-foreground">Loading configuration...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="GTM Configuration" description="Configure Google Tag Manager container ID">
      <div className="space-y-6">
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
    </AdminLayout>
  );
}
