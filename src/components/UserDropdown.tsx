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
  Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { clearVersionedData, STORAGE_KEYS } from '@/lib/localStorageVersioning';
import type { UserProfileBasic } from '@/types/entities';

export const UserDropdown = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfileBasic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHandwerker, setIsHandwerker] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Only synchronous state updates here
      setUser(session?.user ?? null);
      
      // Defer ALL database calls to avoid deadlock
      if (session?.user) {
        setTimeout(() => {
          fetchUserData();
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsHandwerker(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    // Enhanced logout - clear all session data
    const { error } = await supabase.auth.signOut();
    
    // Clear handwerker-related localStorage using versioned utility
    clearVersionedData(STORAGE_KEYS.HANDWERKER_ONBOARDING_DRAFT);
    
    // Clear sessionStorage
    sessionStorage.clear();
    
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
      navigate('/');
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
    if (isAdmin) return 'Administrator';
    if (isHandwerker) return 'Handwerker';
    return 'Kunde';
  };

  if (isLoading || !user) {
    return (
      <Button variant="ghost" onClick={() => navigate('/auth')}>
        <User className="h-4 w-4 mr-2" />
        Login
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
      
      <DropdownMenuContent align="end" className="w-64 bg-surface border-line-200 shadow-xl z-[100]">
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
        
        {isHandwerker ? (
          <>
            <DropdownMenuItem onClick={() => navigate('/handwerker-dashboard')} className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/conversations')} className="cursor-pointer">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Nachrichten</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/submit-lead')} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              <span>Auftrag erstellen</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/conversations')} className="cursor-pointer">
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Nachrichten</span>
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator className="bg-line-200" />
        
        <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
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