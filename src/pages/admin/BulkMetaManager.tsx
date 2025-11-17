import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Search, Save, AlertCircle, CheckCircle, Download, Upload } from 'lucide-react';

interface PageMeta {
  id: string;
  page_key: string;
  content_type: string;
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
  const navigate = useNavigate();
  const { contents, loading, refetch } = useAllPageContent();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<PageMeta['seo']>({});
  const [saving, setSaving] = useState(false);

  const filteredPages = contents.filter(page => 
    page.page_key.toLowerCase().includes(search.toLowerCase()) ||
    page.content_type.toLowerCase().includes(search.toLowerCase())
  );

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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">Loading pages...</p>
      </div>
    );
  }

  const avgScore = Math.round(
    filteredPages.reduce((sum, page) => sum + getSeoHealthScore(page.seo || {}), 0) / 
    (filteredPages.length || 1)
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/seo')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Bulk Meta Management</h1>
          <p className="text-muted-foreground">Manage SEO meta tags for all pages</p>
        </div>
      </div>

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
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search pages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Page</TableHead>
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
                        <Badge variant="outline" className="text-ink-500">
                          {page.content_type}
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
  );
}
