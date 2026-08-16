/**
 * SSOT for requesting a password reset link.
 * Used by the login page and the handwerker onboarding (account-exists case).
 */
import { supabase } from '@/integrations/supabase/client';

export interface PasswordResetResult {
  success: boolean;
  /** de-CH message ready for display */
  message: string;
}

const GENERIC_SUCCESS =
  'Falls ein Konto mit dieser E-Mail existiert, haben wir einen Link zum Zurücksetzen des Passworts gesendet.';

export const requestPasswordReset = async (email: string): Promise<PasswordResetResult> => {
  const normalized = email.trim().toLowerCase();

  if (!normalized) {
    return { success: false, message: 'Bitte geben Sie Ihre E-Mail-Adresse ein.' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-password-reset', {
      body: { email: normalized },
    });

    if (error || data?.success === false) {
      const detail = (data?.error as string | undefined) || error?.message || '';
      return {
        success: false,
        message: detail.toLowerCase().includes('email')
          ? 'Die E-Mail konnte momentan nicht versendet werden. Bitte versuchen Sie es in wenigen Minuten erneut.'
          : 'Die Anfrage konnte nicht verarbeitet werden. Bitte versuchen Sie es in wenigen Minuten erneut oder melden Sie sich bei uns.',
      };
    }

    return { success: true, message: GENERIC_SUCCESS };
  } catch {
    return {
      success: false,
      message: 'Keine Verbindung zum Server. Bitte prüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
    };
  }
};
