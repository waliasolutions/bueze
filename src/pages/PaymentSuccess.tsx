import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [showFallback, setShowFallback] = useState(false);

  const redirectToProfile = () => {
    navigate('/profile?tab=subscription&success=true', { replace: true });
  };

  useEffect(() => {
    redirectToProfile();

    // Safety fallback: show manual button after 3 seconds
    const timer = setTimeout(() => setShowFallback(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Zahlung wird verarbeitet...</p>
      {showFallback && (
        <Button variant="outline" onClick={redirectToProfile}>
          Falls Sie nicht automatisch weitergeleitet werden, klicken Sie bitte hier.
        </Button>
      )}
    </div>
  );
}
