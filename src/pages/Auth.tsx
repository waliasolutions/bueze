import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { CANTON_CODES } from '@/config/cantons';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('signin');
  const navigate = useNavigate();
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'homeowner' as 'homeowner' | 'handwerker',
    phone: '',
    canton: '',
    city: '',
    zip: ''
  });

  const [hideRoleSelector, setHideRoleSelector] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    
    if (roleParam === 'handwerker') {
      setSignUpData(prev => ({ ...prev, role: 'handwerker' }));
      setHideRoleSelector(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Check role from user metadata (single source of truth)
        const userRole = session.user.user_metadata?.role;
        
        if (userRole === 'handwerker') {
          // Check if handwerker profile already exists
          const { data: existingProfile } = await supabase
            .from('handwerker_profiles')
            .select('id, verification_status')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (existingProfile) {
            // Profile exists - go to dashboard
            navigate('/handwerker-dashboard');
          } else {
            // No profile - need onboarding
            navigate('/handwerker-onboarding');
          }
        } else {
          navigate('/dashboard');
        }
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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            first_name: signUpData.firstName,
            last_name: signUpData.lastName,
            role: signUpData.role,
            phone: signUpData.phone,
            canton: signUpData.canton,
            city: signUpData.city,
            zip: signUpData.zip
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
          description: signUpData.role === 'handwerker' 
            ? 'Bitte vervollständigen Sie Ihr Profil im nächsten Schritt.'
            : 'Bitte prüfen Sie Ihre E-Mail für den Bestätigungslink.',
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
          <p className="text-ink-700 mt-2">Anmelden oder registrieren</p>
        </div>

        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Anmelden</TabsTrigger>
                <TabsTrigger value="signup">Registrieren</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="signin" className="space-y-4">
                <CardTitle>Anmelden</CardTitle>
                <CardDescription>
                  Geben Sie Ihre Anmeldedaten ein, um auf Ihr Konto zuzugreifen.
                </CardDescription>
                
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
                    Anmelden
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <CardTitle>Konto erstellen</CardTitle>
                <CardDescription>
                  Erstellen Sie Ihr kostenloses Konto, um loszulegen.
                </CardDescription>
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Vorname</Label>
                      <Input
                        id="firstName"
                        value={signUpData.firstName}
                        onChange={(e) => setSignUpData({ ...signUpData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nachname</Label>
                      <Input
                        id="lastName"
                        value={signUpData.lastName}
                        onChange={(e) => setSignUpData({ ...signUpData, lastName: e.target.value })}
                        required
                      />
                    </div>
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
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>

                  {!hideRoleSelector && (
                    <div className="space-y-2">
                      <Label htmlFor="role">Ich bin...</Label>
                      <Select value={signUpData.role} onValueChange={(value: 'homeowner' | 'handwerker') => setSignUpData({ ...signUpData, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="homeowner">Auftraggeber (brauche Handwerker)</SelectItem>
                          <SelectItem value="handwerker">Handwerker (biete Dienstleistungen)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon (optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+41 79 123 45 67"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData({ ...signUpData, phone: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="canton">Kanton</Label>
                      <Select value={signUpData.canton} onValueChange={(value) => setSignUpData({ ...signUpData, canton: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {CANTON_CODES.map((canton) => (
                            <SelectItem key={canton} value={canton}>{canton}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip">PLZ</Label>
                      <Input
                        id="zip"
                        placeholder="8000"
                        value={signUpData.zip}
                        onChange={(e) => setSignUpData({ ...signUpData, zip: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ort</Label>
                    <Input
                      id="city"
                      placeholder="Zürich"
                      value={signUpData.city}
                      onChange={(e) => setSignUpData({ ...signUpData, city: e.target.value })}
                    />
                  </div>

                  {signUpData.role === 'handwerker' && (
                    <>
                      <div className="space-y-3 pt-4 border-t border-border">
                        <div className="flex items-start gap-2">
                          <Checkbox 
                            id="agb-accept" 
                            required 
                            className="mt-1"
                          />
                          <label htmlFor="agb-accept" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                            Ich akzeptiere die{' '}
                            <Link to="/legal/agb" className="text-brand-600 hover:underline">
                              Allgemeinen Geschäftsbedingungen
                            </Link>
                            {' '}und habe die{' '}
                            <Link to="/pricing" className="text-brand-600 hover:underline">
                              Preisübersicht
                            </Link>
                            {' '}gelesen.
                          </label>
                        </div>
                        
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Manuelle Freigabe erforderlich</AlertTitle>
                          <AlertDescription>
                            Ihr Profil wird nach der Registrierung von uns geprüft. Dies dient dem Schutz der Kundendaten und dauert in der Regel 1-2 Werktage.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </>
                  )}

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Konto erstellen
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}