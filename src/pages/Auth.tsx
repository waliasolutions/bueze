import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';


export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const handlePostLoginRedirect = async (user: any) => {
    // Check for admin/super_admin role FIRST
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (roleData && (roleData.role === 'admin' || roleData.role === 'super_admin')) {
      navigate('/admin/dashboard');
      return;
    }
    
    // Check role from user metadata for handwerker
    const userRole = user.user_metadata?.role;
    
    if (userRole === 'handwerker') {
      const { data: existingProfile } = await supabase
        .from('handwerker_profiles')
        .select('id, verification_status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingProfile) {
        navigate('/handwerker-dashboard');
      } else {
        navigate('/handwerker-onboarding');
      }
    } else {
      navigate('/dashboard');
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Defer database calls to avoid deadlock
        setTimeout(() => {
          handlePostLoginRedirect(session.user);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      });

      if (error) {
        toast({
          title: 'Anmeldefehler',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Willkommen zurück!',
          description: 'Sie wurden erfolgreich angemeldet.',
        });
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie Ihre E-Mail-Adresse ein.',
        variant: 'destructive',
      });
      return;
    }

    setIsResetting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: 'Fehler',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'E-Mail gesendet',
          description: 'Bitte überprüfen Sie Ihren Posteingang für den Link zum Zurücksetzen des Passworts.',
        });
        setIsDialogOpen(false);
        setResetEmail('');
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-ink-900">Büeze.ch</h1>
          <p className="text-ink-700 mt-2">Bei Ihrem Konto anmelden</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Geben Sie Ihre Anmeldedaten ein, um auf Ihr Konto zuzugreifen.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">E-Mail</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="ihre@email.ch"
                  value={signInData.email}
                  onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password">Passwort</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={signInData.password}
                  onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="text-sm text-muted-foreground hover:text-foreground">
                    Passwort vergessen?
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Passwort zurücksetzen</DialogTitle>
                    <DialogDescription>
                      Geben Sie Ihre E-Mail-Adresse ein. Wir senden Ihnen einen Link zum Zurücksetzen Ihres Passworts.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">E-Mail</Label>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="ihre@email.ch"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isResetting}>
                      {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Link senden
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}