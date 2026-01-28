import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { validatePassword, PASSWORD_MIN_LENGTH } from '@/lib/validationHelpers';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import logo from '@/assets/bueze-logo.webp';

const EDGE_FUNCTION_URL = 'https://ztthhdlhuhtwaaennfia.supabase.co/functions/v1/validate-password-reset-token';

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [customToken, setCustomToken] = useState<string | null>(null);
  const [useCustomFlow, setUseCustomFlow] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;
    
    // Debug logging for production troubleshooting
    console.log('[ResetPassword] Component mounted');
    console.log('[ResetPassword] window.location.search:', window.location.search);
    console.log('[ResetPassword] window.location.hash:', window.location.hash);
    
    const initializeTokenValidation = async () => {
      try {
        // Parse token directly from URL (more reliable than useSearchParams with lazy loading)
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        
        console.log('[ResetPassword] Parsed token:', tokenParam ? 'present' : 'missing');
        
        if (tokenParam) {
          console.log('[ResetPassword] Using custom token flow - validating token immediately');
          
          // Pre-validate token on page load for better UX
          try {
            const response = await fetch(EDGE_FUNCTION_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: tokenParam, validateOnly: true })
            });
            
            const data = await response.json();
            console.log('[ResetPassword] Token validation response:', data);
            
            if (!isMounted) return;
            
            if (data.valid) {
              console.log('[ResetPassword] Token is valid, showing password form');
              setCustomToken(tokenParam);
              setUseCustomFlow(true);
              setIsValidToken(true);
            } else {
              console.log('[ResetPassword] Token is invalid or expired');
              setIsValidToken(false);
              setTokenError(data.error || 'Ungültiger oder abgelaufener Link');
            }
          } catch (fetchError) {
            console.error('[ResetPassword] Error validating token:', fetchError);
            // On network error, still allow attempt (will validate on submit)
            if (!isMounted) return;
            setCustomToken(tokenParam);
            setUseCustomFlow(true);
            setIsValidToken(true);
          }
          
          if (isMounted) setIsLoading(false);
          return;
        }
        
        // Legacy Supabase flow - check URL hash for recovery tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hasRecoveryParams = hashParams.has('access_token') || 
                                  (hashParams.has('type') && hashParams.get('type') === 'recovery');
        
        console.log('[ResetPassword] Has recovery params in hash:', hasRecoveryParams);
        
        // Listen for PASSWORD_RECOVERY event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          // Defer async operations per Supabase best practices
          setTimeout(() => {
            if (!isMounted) return;
            
            console.log('[ResetPassword] Auth state change:', event);
            
            if (event === 'PASSWORD_RECOVERY') {
              setIsValidToken(true);
              setIsLoading(false);
            } else if (event === 'SIGNED_IN' && session) {
              // Recovery flow sometimes emits SIGNED_IN instead of PASSWORD_RECOVERY
              setIsValidToken(true);
              setIsLoading(false);
            }
          }, 0);
        });

        // Check for existing session (handles case where event already fired)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted) {
          subscription.unsubscribe();
          return;
        }
        
        if (session?.user) {
          console.log('[ResetPassword] Existing session found');
          setIsValidToken(true);
          setIsLoading(false);
          return;
        }
        
        // If URL had recovery params but no session yet, wait a bit for Supabase to process
        if (hasRecoveryParams) {
          // Give Supabase time to process the token exchange
          timeoutId = setTimeout(async () => {
            if (!isMounted) return;
            
            // Final check before declaring invalid
            const { data: { session: finalSession } } = await supabase.auth.getSession();
            
            if (!isMounted) return;
            
            if (finalSession?.user) {
              setIsValidToken(true);
            } else {
              console.log('[ResetPassword] No session after timeout, showing invalid');
              setIsValidToken(false);
              setTokenError('Ungültiger oder abgelaufener Link');
              toast({
                title: 'Ungültiger oder abgelaufener Link',
                description: 'Bitte fordern Sie einen neuen Link zum Zurücksetzen des Passworts an.',
                variant: 'destructive',
              });
              setTimeout(() => navigate('/auth'), 3000);
            }
            setIsLoading(false);
          }, 2000);
        } else {
          // No recovery params in URL and no session - invalid access
          console.log('[ResetPassword] No token or recovery params found');
          setIsValidToken(false);
          setTokenError('Kein Token gefunden');
          setIsLoading(false);
        }

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[ResetPassword] Error in initialization:', error);
        if (isMounted) {
          setIsLoading(false);
          setIsValidToken(false);
          setTokenError('Ein Fehler ist aufgetreten');
        }
      }
    };

    initializeTokenValidation();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, toast]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        title: 'Fehler',
        description: 'Die Passwörter stimmen nicht überein.',
        variant: 'destructive',
      });
      return;
    }

    // Validate password using SSOT validation helper
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      toast({
        title: 'Fehler',
        description: passwordValidation.error,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (useCustomFlow && customToken) {
        console.log('[ResetPassword] Submitting password reset via custom token flow');
        
        // Custom token flow - call edge function
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: customToken, newPassword: password })
        });

        const data = await response.json();
        console.log('[ResetPassword] Password reset response:', { success: data.success, error: data.error });

        if (!response.ok || !data.success) {
          toast({
            title: 'Fehler',
            description: data.error || 'Ungültiger oder abgelaufener Link.',
            variant: 'destructive',
          });
          return;
        }

        setIsSuccess(true);
        toast({
          title: 'Passwort aktualisiert',
          description: 'Ihr Passwort wurde erfolgreich geändert. Sie werden zur Login-Seite weitergeleitet.',
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } else {
        console.log('[ResetPassword] Submitting password reset via Supabase flow');
        
        // Legacy Supabase flow
        const { error } = await supabase.auth.updateUser({
          password: password
        });

        if (error) {
          console.error('[ResetPassword] Supabase password update error:', error);
          toast({
            title: 'Fehler',
            description: error.message,
            variant: 'destructive',
          });
        } else {
          setIsSuccess(true);
          toast({
            title: 'Passwort aktualisiert',
            description: 'Ihr Passwort wurde erfolgreich geändert. Sie werden zur Login-Seite weitergeleitet.',
          });
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('[ResetPassword] Password reset error:', error);
      toast({
        title: 'Fehler',
        description: 'Ein unerwarteter Fehler ist aufgetreten.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <CardTitle className="mt-4">Link wird überprüft...</CardTitle>
            <CardDescription>
              Bitte warten Sie einen Moment.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
        <div className="max-w-md w-full space-y-8">
          <div className="flex justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Startseite
            </Button>
          </div>

          <Card className="border-2">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-500" />
              </div>
              <CardTitle className="text-2xl">Passwort erfolgreich geändert!</CardTitle>
              <CardDescription>
                Ihr neues Passwort wurde gespeichert. Sie werden in wenigen Sekunden zur Login-Seite weitergeleitet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full"
              >
                Jetzt anmelden
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Ungültiger Link</CardTitle>
            <CardDescription>
              {tokenError || 'Dieser Link ist abgelaufen oder ungültig. Bitte fordern Sie einen neuen Link an.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
            >
              Zur Login-Seite
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 pt-20">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </Button>
        </div>

        <Card className="border-2">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 relative mb-2">
              <img 
                src={logo} 
                alt="Büeze.ch Logo" 
                className="w-full h-full object-contain"
                loading="eager"
                decoding="async"
              />
            </div>
            <CardTitle className="text-2xl">Neues Passwort erstellen</CardTitle>
            <CardDescription>
              Geben Sie Ihr neues Passwort ein. Es muss mindestens {PASSWORD_MIN_LENGTH} Zeichen lang sein.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Neues Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={`Mindestens ${PASSWORD_MIN_LENGTH} Zeichen`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Passwort wiederholen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Passwort ändern
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
