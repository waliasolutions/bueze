import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { getUserRoles } from '@/lib/roleHelpers';
import { validatePassword, PASSWORD_MIN_LENGTH } from '@/lib/validationHelpers';
import { Loader2, ArrowLeft } from 'lucide-react';
import { DynamicHelmet } from '@/components/DynamicHelmet';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  });

  const handlePostLoginRedirect = async (user: { id: string; user_metadata?: Record<string, unknown> }, roleData: { role: string } | null, isHandwerkerRole: boolean) => {
    // Check for admin/super_admin role FIRST
    if (roleData && (roleData.role === 'admin' || roleData.role === 'super_admin')) {
      navigate('/admin/dashboard');
      return;
    }
    
    // Fetch handwerker profile
    const { data: existingProfile } = await supabase
      .from('handwerker_profiles')
      .select('id, verification_status')
      .eq('user_id', user.id)
      .maybeSingle();
    
    // Check if user is a handwerker (by role or metadata)
    const userRole = user.user_metadata?.role;
    const isHandwerker = isHandwerkerRole || userRole === 'handwerker';
    
    if (isHandwerker) {
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
        // Defer ALL async operations to avoid deadlock - per Supabase best practices
        setTimeout(async () => {
          try {
            const allRoles = await getUserRoles(session.user.id);
            const primaryRole = allRoles[0] || null;
            const roleData = primaryRole ? { role: primaryRole } : null;
            const isHandwerkerRole = allRoles.includes('handwerker');
            handlePostLoginRedirect(session.user, roleData, isHandwerkerRole);
          } catch (error) {
            console.error('Error fetching roles during auth:', error);
            // Fallback to dashboard on error
            navigate('/dashboard');
          }
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
      }
      // Success handled by onAuthStateChange - no toast needed
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords match
    if (signUpData.password !== signUpData.confirmPassword) {
      toast({
        title: 'Fehler',
        description: 'Die Passwörter stimmen nicht überein.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Validate password using SSOT validation helper
    const passwordValidation = validatePassword(signUpData.password);
    if (!passwordValidation.valid) {
      toast({
        title: 'Fehler',
        description: passwordValidation.error,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: signUpData.fullName,
          }
        }
      });

      if (error) {
        toast({
          title: 'Registrierungsfehler',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registrierung erfolgreich!',
          description: 'Bitte überprüfen Sie Ihre E-Mail zur Bestätigung.',
        });
        setIsSignUp(false);
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
      <DynamicHelmet
        title="Anmelden | Büeze.ch"
        description="Melden Sie sich bei Büeze.ch an, um Handwerker zu finden oder als Handwerker Aufträge zu erhalten."
        robotsMeta="noindex,nofollow"
      />
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
            <CardTitle>{isSignUp ? 'Registrieren' : 'Login'}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Erstellen Sie ein neues Konto'
                : 'Geben Sie Ihre Anmeldedaten ein, um auf Ihr Konto zuzugreifen.'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isSignUp ? (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Ihr Name"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">E-Mail</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="ihre@email.ch"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Passwort</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder={`Mindestens ${PASSWORD_MIN_LENGTH} Zeichen`}
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Passwort bestätigen</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="Passwort wiederholen"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    required
                    minLength={8}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Registrieren
                </Button>
              </form>
            ) : (
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
            )}

            <div className="mt-4 text-center space-y-2">
              {!isSignUp && (
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
              )}

              <div className="pt-2 border-t">
                <Button 
                  variant="link" 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm w-full"
                >
                  {isSignUp 
                    ? 'Haben Sie bereits ein Konto? Hier anmelden' 
                    : 'Noch kein Konto? Jetzt registrieren'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}