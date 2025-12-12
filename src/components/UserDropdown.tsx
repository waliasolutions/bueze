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
  ClipboardList
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { clearVersionedData, STORAGE_KEYS } from '@/lib/localStorageVersioning';
import { useUserRole } from '@/hooks/useUserRole';
import type { UserProfileBasic } from '@/types/entities';

export const UserDropdown = () => {
  const [profile, setProfile] = useState<UserProfileBasic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId, isAdmin, isHandwerker, isClient, loading: roleLoading } = useUserRole();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        setProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!roleLoading) {
      fetchProfile();
    }
  }, [userId, roleLoading]);

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
    return profile?.email?.split('@')[0] || 'Benutzer';
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrator';
    if (isHandwerker) return 'Handwerker';
    return 'Kunde';
  };

  if (isLoading || roleLoading || !userId) {
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
              {profile?.email}
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
              <ClipboardList className="mr-2 h-4 w-4" />
              <span>Meine Aufträge</span>
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