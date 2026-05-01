import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword } from '@/lib/validationHelpers';
import { AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';

/**
 * SSOT for the admin "reset user password" flow.
 * Reused by /admin/users and /admin/handwerker.
 *
 * Calls the existing `reset-user-password` edge function with `notifyUsers: false`
 * so the admin can communicate the password out-of-band.
 */

export const SUPPORT_PASSWORD = 'A12345678';

export interface PasswordResetTarget {
  userId: string;
  email: string;
  name?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: PasswordResetTarget | null;
}

export function PasswordResetDialog({ open, onOpenChange, target }: Props) {
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState<'support' | 'custom'>('support');
  const [customPwInput, setCustomPwInput] = useState('');
  const [customPwConfirm, setCustomPwConfirm] = useState('');

  // Reset internal state whenever the dialog closes
  useEffect(() => {
    if (!open) {
      setGeneratedPassword('');
      setShowPassword(false);
      setResetMode('support');
      setCustomPwInput('');
      setCustomPwConfirm('');
      setActionLoading(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!target) return;

    let passwordToSet: string;
    if (resetMode === 'custom') {
      if (customPwInput !== customPwConfirm) {
        toast({
          title: 'Passwörter stimmen nicht überein',
          description: 'Bitte geben Sie in beiden Feldern dasselbe Passwort ein.',
          variant: 'destructive',
        });
        return;
      }
      const validation = validatePassword(customPwInput);
      if (!validation.valid) {
        toast({
          title: 'Ungültiges Passwort',
          description: validation.error,
          variant: 'destructive',
        });
        return;
      }
      passwordToSet = customPwInput;
    } else {
      passwordToSet = SUPPORT_PASSWORD;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: target.userId,
          userEmail: target.email,
          userName: target.name || target.email,
          customPassword: passwordToSet,
          notifyUsers: false,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setGeneratedPassword(passwordToSet);
      }

      toast({
        title: resetMode === 'custom' ? 'Eigenes Passwort gesetzt' : 'Support-Passwort gesetzt',
        description: `Das Passwort für ${target.email} wurde aktualisiert.`,
      });
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast({
        title: 'Fehler',
        description: err?.message || 'Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
      onOpenChange(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast({
        title: 'Kopiert',
        description: 'Passwort wurde in die Zwischenablage kopiert.',
      });
    }
  };

  const handleClose = () => onOpenChange(false);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Passwort zurücksetzen
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-left">
              {!generatedPassword ? (
                <div className="space-y-4">
                  <p>
                    Passwort für <strong>{target?.email}</strong> setzen.
                    Dem Benutzer wird keine E-Mail gesendet — das gewählte Passwort
                    muss ihm manuell mitgeteilt werden.
                  </p>

                  <div className="flex gap-2 rounded-lg bg-muted p-1">
                    <button
                      type="button"
                      onClick={() => setResetMode('support')}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        resetMode === 'support'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Support-Passwort
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetMode('custom')}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        resetMode === 'custom'
                          ? 'bg-background text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Eigenes Passwort
                    </button>
                  </div>

                  {resetMode === 'support' ? (
                    <p className="text-sm text-muted-foreground">
                      Festes Support-Passwort:{' '}
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono">{SUPPORT_PASSWORD}</code>
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="custom-pw">Neues Passwort</Label>
                        <Input
                          id="custom-pw"
                          type={showPassword ? 'text' : 'password'}
                          value={customPwInput}
                          onChange={(e) => setCustomPwInput(e.target.value)}
                          placeholder="Mind. 8 Zeichen, Buchstabe + Zahl"
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="custom-pw-confirm">Passwort bestätigen</Label>
                        <div className="flex gap-2">
                          <Input
                            id="custom-pw-confirm"
                            type={showPassword ? 'text' : 'password'}
                            value={customPwConfirm}
                            onChange={(e) => setCustomPwConfirm(e.target.value)}
                            autoComplete="new-password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowPassword(!showPassword)}
                            title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-foreground">
                    Das Passwort wurde erfolgreich gesetzt für:
                    <br />
                    <strong>{target?.email}</strong>
                  </p>
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <p className="text-sm font-medium">Neues Passwort:</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background px-3 py-2 rounded border font-mono text-sm break-all">
                        {showPassword ? generatedPassword : '••••••••••••••••'}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" onClick={handleCopyPassword}>
                        Kopieren
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Kopieren Sie das Passwort und teilen Sie es dem Benutzer manuell mit, damit er sich sofort anmelden kann.
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!generatedPassword ? (
            <>
              <AlertDialogCancel onClick={handleClose}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirm} disabled={actionLoading}>
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird zurückgesetzt...
                  </>
                ) : (
                  'Passwort zurücksetzen'
                )}
              </AlertDialogAction>
            </>
          ) : (
            <Button onClick={handleClose} className="w-full">
              Schliessen
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
