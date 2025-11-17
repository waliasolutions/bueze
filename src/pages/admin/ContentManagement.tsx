import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Edit, Search, FileText, Home, Scale } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PageContent {
  id: string;
  page_key: string;
  content_type: string;
  fields: any;
  seo: any;
  status: string;
  updated_at: string;
}

const ContentManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contents, setContents] = useState<PageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContents();
  }, []);

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('page_content')
        .select('*')
        .order('content_type', { ascending: true })
        .order('page_key', { ascending: true });

      if (error) throw error;
      setContents(data || []);
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

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'category':
        return <FileText className="w-4 h-4" />;
      case 'homepage':
        return <Home className="w-4 h-4" />;
      case 'legal':
        return <Scale className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'category':
        return 'Kategorie';
      case 'homepage':
        return 'Startseite';
      case 'legal':
        return 'Rechtliches';
      default:
        return type;
    }
  };

  const filteredContents = contents.filter((content) =>
    content.page_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    content.fields?.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Content Management</h1>
              <p className="text-muted-foreground mt-2">
                Verwalten Sie alle Inhalte Ihrer Website
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alle Seiten</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Laden...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Typ</TableHead>
                      <TableHead>Seite</TableHead>
                      <TableHead>Titel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Zuletzt aktualisiert</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Keine Inhalte gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredContents.map((content) => (
                        <TableRow key={content.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getContentTypeIcon(content.content_type)}
                              <span className="text-sm">{getContentTypeLabel(content.content_type)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{content.page_key}</TableCell>
                          <TableCell className="font-medium">
                            {content.fields?.title || '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={content.status === 'published' ? 'default' : 'secondary'}>
                              {content.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(content.updated_at).toLocaleDateString('de-CH', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/content/edit/${content.page_key}`)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Bearbeiten
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ContentManagement;
