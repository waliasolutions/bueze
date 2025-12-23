import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AdminSidebar } from './AdminSidebar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Shield, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  /** Controls fade transition for content loading */
  isLoading?: boolean;
}

export function AdminLayout({ children, title, description, isLoading = false }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-16 flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar />
        </div>
        
        <main className="flex-1 p-4 lg:p-6 min-w-0">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Header with Menu Button */}
            <div className="flex items-center gap-3 mb-4 lg:mb-6">
              {/* Mobile Menu Trigger */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden h-10 w-10 shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <AdminSidebar onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              
              <div className="min-w-0 flex-1">
                <Badge variant="outline" className="mb-1 bg-red-50 text-red-700 border-red-200 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
                <h1 className="text-xl lg:text-2xl font-bold text-foreground truncate">{title}</h1>
                {description && (
                  <p className="text-muted-foreground text-sm mt-0.5 hidden sm:block">{description}</p>
                )}
              </div>
            </div>
            {/* Content with fade transition */}
            <div 
              className={cn(
                "transition-opacity duration-200",
                isLoading ? "opacity-0" : "opacity-100 animate-fade-in"
              )}
            >
              {children}
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
