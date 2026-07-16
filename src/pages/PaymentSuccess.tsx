import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicHelmet } from "@/components/DynamicHelmet";
import { supabase } from "@/integrations/supabase/client";

/**
 * Payment success landing page.
 *
 * The Payrexx webhook is the primary activation path, but if it's delayed or
 * fails to reach us the user would otherwise land here with a debited card and
 * no active subscription. We call `verify-payrexx-payment` on arrival to pull
 * the transaction from Payrexx and activate through the SAME shared pipeline
 * as the webhook. Idempotent by transaction id — safe to run every visit.
 */
export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFallback, setShowFallback] = useState(false);
  const verifiedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const redirectToProfile = () => {
      if (cancelled) return;
      navigate('/profile?tab=subscription&success=true', { replace: true });
    };

    const verifyAndRedirect = async () => {
      if (verifiedRef.current) return;
      verifiedRef.current = true;

      // Payrexx appends its own params on redirect; also accept our own hints.
      const transactionId =
        searchParams.get('transaction_id') ||
        searchParams.get('transactionId') ||
        searchParams.get('tx');
      const referenceId =
        searchParams.get('reference_id') ||
        searchParams.get('referenceId');

      try {
        if (transactionId || referenceId) {
          await supabase.functions.invoke('verify-payrexx-payment', {
            body: { transactionId, referenceId },
          });
        }
      } catch (err) {
        // Non-blocking — the webhook or reconciliation cron will still catch it.
        console.warn('[PaymentSuccess] verify-payrexx-payment failed', err);
      } finally {
        redirectToProfile();
      }
    };

    verifyAndRedirect();
    const timer = setTimeout(() => setShowFallback(true), 5000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <DynamicHelmet
        title="Zahlung erfolgreich | Büeze.ch"
        robotsMeta="noindex,nofollow"
      />
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Zahlung wird verarbeitet...</p>
      {showFallback && (
        <Button
          variant="outline"
          onClick={() => navigate('/profile?tab=subscription&success=true', { replace: true })}
        >
          Falls Sie nicht automatisch weitergeleitet werden, klicken Sie bitte hier.
        </Button>
      )}
    </div>
  );
}
