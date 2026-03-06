import React, { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface AdminPasswordResetDialogProps {
  user: { id: string; email: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdminPasswordResetDialog: React.FC<AdminPasswordResetDialogProps> = ({
  user,
  open,
  onOpenChange,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
        },
      });

      if (error) throw error;

      if (data?.newPassword) {
        setGeneratedPassword(data.newPassword);
      }

      toast({
        title: 'Passwort zurückgesetzt',
        description: `Das Passwort für ${user.email} wurde zurückgesetzt.`,
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Fehler',
        description: error.message || 'Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast({
        title: 'Kopiert',
        description: 'Passwort wurde in die Zwischenablage kopiert.',
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setGeneratedPassword('');
    setShowPassword(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Passwort zurücksetzen
          </AlertDialogTitle>
          <AlertDialogDescription>
            {!generatedPassword ? (
              <>
                Möchten Sie wirklich das Passwort für <strong>{user?.email}</strong> zurücksetzen?
                <br /><br />
                Ein neues sicheres Passwort wird generiert und per E-Mail an den Benutzer gesendet.
              </>
            ) : (
              <div className="space-y-4 text-left">
                <p className="text-foreground">
                  Das Passwort wurde erfolgreich zurückgesetzt für:
                  <br />
                  <strong>{user?.email}</strong>
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Neues Passwort:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded border font-mono text-sm">
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
                    <Button size="sm" onClick={handleCopy}>
                      Kopieren
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Falls die E-Mail nicht angekommen ist, können Sie das Passwort kopieren und dem Benutzer manuell mitteilen.
                </p>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!generatedPassword ? (
            <>
              <AlertDialogCancel onClick={handleClose}>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset} disabled={loading}>
                {loading ? (
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
};
