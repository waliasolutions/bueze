import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAllPageContent } from '@/hooks/usePageContent';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Save, AlertCircle, Download, Upload, Globe, ExternalLink } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface PageMeta {
  id: string;
  page_key: string;
  content_type: string;
  url?: string;
  page_type?: string;
  seo: {
    title?: string;
    description?: string;
    canonical?: string;
    og_image?: string;
    robots?: string;
  };
  status: string;
}

export default function BulkMetaManager() {
  const { isChecking, hasChecked, isAuthorized } = useAdminAuth();
  const { contents, loading, refetch } = useAllPageContent();
  const { settings: siteSettings, updateSettings } = useSiteSettings();
  const [search, setSearch] = useState('');
  const [pageTypeFilter, setPageTypeFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<PageMeta['seo']>({});
  const [saving, setSaving] = useState(false);
  const [defaultMetaData, setDefaultMetaData] = useState({
    site_name: '',
    default_meta_title: '',
    default_meta_description: '',
    default_og_image: '',
  });

  // Initialize default meta data from site settings
  useEffect(() => {
    if (siteSettings) {
      setDefaultMetaData({
        site_name: siteSettings.site_name || '',
        default_meta_title: siteSettings.default_meta_title || '',
        default_meta_description: siteSettings.default_meta_description || '',
        default_og_image: siteSettings.default_og_image || '',
      });
    }
  }, [siteSettings]);

  const filteredPages = (contents as PageMeta[])?.filter(page => {
    const matchesSearch =
      page.page_key.toLowerCase().includes(search.toLowerCase()) ||
      page.seo?.title?.toLowerCase().includes(search.toLowerCase()) ||
      page.url?.toLowerCase().includes(search.toLowerCase());
    const matchesType = pageTypeFilter === 'all' || page.page_type === pageTypeFilter;
    return matchesSearch && matchesType;
  }) || [];

  const handleEdit = (page: any) => {
    setEditingId(page.id);
    setEditData(page.seo || {});
  };

  const handleSave = async (pageId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('page_content')
        .update({ seo: editData })
        .eq('id', pageId);

      if (error) throw error;

      toast.success('Meta tags updated successfully');
      setEditingId(null);
      refetch();
    } catch (error: any) {
      toast.error('Failed to update meta tags: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSaveDefaults = async () => {
    setSaving(true);
    try {
      const result = await updateSettings(defaultMetaData);
      if (result.success) {
        toast.success('Default meta tags saved successfully');
      } else {
        toast.error('Failed to save: ' + result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const getSeoHealthScore = (seo: PageMeta['seo']) => {
    let score = 0;
    if (seo?.title) score += 25;
    if (seo?.description) score += 25;
    if (seo?.canonical) score += 25;
    if (seo?.og_image) score += 25;
    return score;
  };

  const getSeoHealthBadge = (score: number) => {
    if (score >= 75) return <Badge className="bg-pastel-green-50 text-ink-700">Excellent</Badge>;
    if (score >= 50) return <Badge className="bg-brand-100 text-ink-700">Good</Badge>;
    if (score >= 25) return <Badge variant="outline" className="border-ink-300 text-ink-700">Needs Work</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  if ((isChecking && !hasChecked) || !isAuthorized) {
    return <PageSkeleton />;
  }

  if (loading) {
    return (
      <AdminLayout title="Bulk Meta Management" description="Manage SEO meta tags for all pages and site-wide defaults">
        <p className="text-muted-foreground">Loading pages...</p>
      </AdminLayout>
    );
  }

  const avgScore = Math.round(
    filteredPages.reduce((sum, page) => sum + getSeoHealthScore(page.seo || {}), 0) / 
    (filteredPages.length || 1)
  );

  return (
    <AdminLayout title="Bulk Meta Management" description="Manage SEO meta tags for all pages and site-wide defaults">
      <div className="space-y-6">

      {/* Default Meta Tags Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-brand-500" />
            Default Meta Tags
          </CardTitle>
          <CardDescription>
            Site-wide fallback meta tags used when individual pages don't have specific values
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                placeholder="Büeze.ch"
                value={defaultMetaData.site_name}
                onChange={(e) => setDefaultMetaData({ ...defaultMetaData, site_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_og_image">Default OG Image URL</Label>
              <Input
                id="default_og_image"
                placeholder="https://..."
                value={defaultMetaData.default_og_image}
                onChange={(e) => setDefaultMetaData({ ...defaultMetaData, default_og_image: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_title">Default Meta Title</Label>
            <Input
              id="default_title"
              placeholder="Site-wide default title"
              value={defaultMetaData.default_meta_title}
              onChange={(e) => setDefaultMetaData({ ...defaultMetaData, default_meta_title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_description">Default Meta Description</Label>
            <Textarea
              id="default_description"
              placeholder="Site-wide default description"
              rows={3}
              value={defaultMetaData.default_meta_description}
              onChange={(e) => setDefaultMetaData({ ...defaultMetaData, default_meta_description: e.target.value })}
            />
          </div>
          <Button onClick={handleSaveDefaults} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Defaults'}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{contents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average SEO Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-foreground">{avgScore}%</div>
              {getSeoHealthBadge(avgScore)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Missing Metas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {contents.filter(p => getSeoHealthScore(p.seo || {}) < 50).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Pages</CardTitle>
              <CardDescription>Click on a row to edit meta tags</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" disabled>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by page key, title, or URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={pageTypeFilter} onValueChange={setPageTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pages</SelectItem>
                <SelectItem value="major_category">Major Categories</SelectItem>
                <SelectItem value="homepage">Homepage</SelectItem>
                <SelectItem value="handwerker">Handwerker</SelectItem>
                <SelectItem value="legal">Legal Pages</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Page Key</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Meta Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => {
                  const isEditing = editingId === page.id;
                  const score = getSeoHealthScore(page.seo || {});

                  return (
                    <TableRow key={page.id} className={isEditing ? 'bg-secondary' : ''}>
                      <TableCell className="font-medium text-foreground">{page.page_key}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{page.url || '-'}</span>
                          {page.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => window.open(page.url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-ink-500">
                          {page.page_type || 'other'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Input
                            value={editData.title || ''}
                            onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                            placeholder="Meta title"
                            className="h-8"
                          />
                        ) : (
                          <span className="text-sm text-foreground">{page.seo?.title || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {isEditing ? (
                          <Textarea
                            value={editData.description || ''}
                            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                            placeholder="Meta description"
                            rows={2}
                            className="text-sm"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground line-clamp-2">
                            {page.seo?.description || '-'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{getSeoHealthBadge(score)}</TableCell>
                      <TableCell>
                        <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                          {page.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="sm" onClick={() => handleSave(page.id)} disabled={saving}>
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleCancel}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => handleEdit(page)}>
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredPages.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No pages found matching your search.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
