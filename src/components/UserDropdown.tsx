import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Settings, 
  LogOut, 
  LayoutDashboard, 
  MessageSquare, 
  Plus, 
  Search,
  FileText,
  Heart,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  role?: 'homeowner' | 'handwerker' | 'admin';
  avatar_url?: string;
}

export const UserDropdown = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHandwerker, setIsHandwerker] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleNavigateWithScroll = (path: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(path);
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          setProfile(profileData);

          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .in('role', ['admin', 'super_admin'])
            .maybeSingle();
          
          setIsAdmin(!!roleData);

          // Check if user has handwerker profile
          const { data: handwerkerData } = await supabase
            .from('handwerker_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          setIsHandwerker(!!handwerkerData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        setProfile(profileData);

        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .in('role', ['admin', 'super_admin'])
          .maybeSingle();
        
        setIsAdmin(!!roleData);

        // Check if user has handwerker profile
        const { data: handwerkerData } = await supabase
          .from('handwerker_profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        setIsHandwerker(!!handwerkerData);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsHandwerker(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: 'Fehler',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Erfolgreich abgemeldet',
        description: 'Sie wurden erfolgreich abgemeldet.',
      });
      handleNavigateWithScroll('/');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getUserDisplayName = () => {
    if (profile?.full_name) return profile.full_name;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile?.first_name) return profile.first_name;
    return user?.email?.split('@')[0] || 'Benutzer';
  };

  const getRoleLabel = () => {
    if (isHandwerker) return 'Handwerker';
    return 'Auftraggeber';
  };

  if (isLoading || !user) {
    return (
      <Button variant="ghost" onClick={() => handleNavigateWithScroll('/auth')}>
        <User className="h-4 w-4 mr-2" />
        Anmelden
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url} />
            <AvatarFallback className="bg-brand-500 text-white text-sm font-medium">
              {getInitials(getUserDisplayName())}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:flex flex-col items-start text-left">
            <span className="text-sm font-medium text-ink-900">
              {getUserDisplayName()}
            </span>
            <span className="text-xs text-ink-500">
              {getRoleLabel()}
            </span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64 bg-surface border-line-200">
        <DropdownMenuLabel className="pb-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium text-ink-900">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-ink-500">
              {user.email}
            </p>
            <p className="text-xs text-brand-600 font-medium">
              {getRoleLabel()}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-line-200" />
        
        <DropdownMenuItem onClick={() => handleNavigateWithScroll('/dashboard')} className="cursor-pointer">
          <LayoutDashboard className="mr-2 h-4 w-4" />
          <span>Dashboard</span>
        </DropdownMenuItem>
        
        {isHandwerker ? (
          <>
            <DropdownMenuItem onClick={() => handleNavigateWithScroll('/search')} className="cursor-pointer">
              <Search className="mr-2 h-4 w-4" />
              <span>Leads durchsuchen</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigateWithScroll('/dashboard')} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              <span>Gekaufte Aufträge</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => handleNavigateWithScroll('/dashboard')} className="cursor-pointer">
              <FileText className="mr-2 h-4 w-4" />
              <span>Meine Aufträge</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigateWithScroll('/submit-lead')} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              <span>Auftrag erstellen</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuItem onClick={() => handleNavigateWithScroll('/conversations')} className="cursor-pointer">
          <MessageSquare className="mr-2 h-4 w-4" />
          <span>Nachrichten</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-line-200" />

        {isAdmin && (
          <>
            <DropdownMenuItem onClick={() => handleNavigateWithScroll('/admin/approvals')} className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Handwerker-Freigaben</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigateWithScroll('/admin/handwerker-verification')} className="cursor-pointer">
              <ShieldCheck className="mr-2 h-4 w-4" />
              <span>Handwerker-Verifizierung</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-line-200" />
          </>
        )}
        
        <DropdownMenuItem onClick={() => handleNavigateWithScroll('/profile')} className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>Profil</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator className="bg-line-200" />
        
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};