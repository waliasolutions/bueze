import { useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { CheckCircle, MessageSquare, Clock, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const LeadSubmissionSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const leadTitle = location.state?.leadTitle;

  // Push GTM conversion event on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'conversion',
        conversionType: 'lead_submission',
        leadTitle: leadTitle || undefined,
      });
    }
  }, [leadTitle]);

  // Redirect if accessed directly without state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!location.state) {
        // Still show the page but note it was accessed directly
        console.log('[LeadSubmissionSuccess] Page accessed directly without state');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [location.state]);

  const steps = [
    {
      icon: MessageSquare,
      title: 'Handwerker werden Sie kontaktieren',
      description: 'Qualifizierte Handwerker in Ihrer Region sehen Ihren Auftrag und können Ihnen Angebote schicken.',
    },
    {
      icon: Clock,
      title: 'Sie erhalten Angebote',
      description: 'Angebote kommen per E-Mail und sind in Ihrem Dashboard sichtbar. Meist innerhalb von 24-48 Stunden.',
    },
    {
      icon: CheckCircle,
      title: 'Vergleichen und auswählen',
      description: 'Vergleichen Sie die Angebote und wählen Sie den passenden Handwerker für Ihr Projekt.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet 
        title="Auftrag erfolgreich erstellt | Büeze.ch"
        description="Ihr Auftrag wurde erfolgreich erstellt und ist jetzt für Handwerker sichtbar."
        robotsMeta="noindex,nofollow"
      />
      <Header />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Success Animation */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 animate-in zoom-in duration-300">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
              Vielen Dank für Ihren Auftrag!
            </h1>
            
            <p className="text-muted-foreground text-lg">
              Ihr Auftrag ist jetzt aktiv und sichtbar für qualifizierte Handwerker in Ihrer Region.
            </p>
          </div>

          {/* What's Next */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Was passiert als nächstes?</CardTitle>
              <CardDescription>
                So geht es weiter mit Ihrem Auftrag
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{step.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/dashboard')}
              className="min-h-[48px]"
            >
              Zum Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              asChild
              className="min-h-[48px]"
            >
              <Link to="/">Zurück zur Startseite</Link>
            </Button>
          </div>

          {/* Email reminder */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Sie erhalten eine Bestätigung per E-Mail mit allen Details zu Ihrem Auftrag.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LeadSubmissionSuccess;
