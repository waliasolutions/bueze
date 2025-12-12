import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminSidebar } from './AdminSidebar';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-24 flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <Badge variant="outline" className="mb-2 bg-red-50 text-red-700 border-red-200">
                <Shield className="h-3 w-3 mr-1" />
                Admin-Bereich
              </Badge>
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
