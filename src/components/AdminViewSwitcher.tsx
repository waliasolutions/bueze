import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Eye, Shield, User, Briefcase, ChevronDown } from 'lucide-react';

type ViewMode = 'admin' | 'client' | 'handwerker';

interface AdminViewSwitcherProps {
  currentView?: ViewMode;
}

const VIEW_LABELS: Record<ViewMode, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'bg-red-100 text-red-700 border-red-200' },
  client: { label: 'Kunden', icon: User, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  handwerker: { label: 'Handwerker', icon: Briefcase, color: 'bg-green-100 text-green-700 border-green-200' },
};

export const AdminViewSwitcher: React.FC<AdminViewSwitcherProps> = ({ currentView = 'admin' }) => {
  const navigate = useNavigate();
  const CurrentIcon = VIEW_LABELS[currentView].icon;

  const handleViewChange = (view: ViewMode) => {
    switch (view) {
      case 'admin':
        navigate('/admin/dashboard');
        break;
      case 'client':
        navigate('/dashboard');
        break;
      case 'handwerker':
        navigate('/handwerker-dashboard');
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye className="h-4 w-4" />
          <Badge variant="outline" className={VIEW_LABELS[currentView].color}>
            <CurrentIcon className="h-3 w-3 mr-1" />
            {VIEW_LABELS[currentView].label}-Ansicht
          </Badge>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Ansicht wechseln
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => handleViewChange('admin')}
          className={currentView === 'admin' ? 'bg-accent' : ''}
        >
          <Shield className="h-4 w-4 mr-2 text-red-600" />
          Admin-Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleViewChange('client')}
          className={currentView === 'client' ? 'bg-accent' : ''}
        >
          <User className="h-4 w-4 mr-2 text-blue-600" />
          Kunden-Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleViewChange('handwerker')}
          className={currentView === 'handwerker' ? 'bg-accent' : ''}
        >
          <Briefcase className="h-4 w-4 mr-2 text-green-600" />
          Handwerker-Dashboard
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
