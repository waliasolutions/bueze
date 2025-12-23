import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DynamicHelmet } from '@/components/DynamicHelmet';
import { CheckCircle, Mail, Shield, Briefcase, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const HandwerkerRegistrationSuccess = () => {
  const location = useLocation();
  const companyName = location.state?.companyName;

  // Push GTM conversion event on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        event: 'conversion',
        conversionType: 'handwerker_registration',
        companyName: companyName || undefined,
      });
    }
  }, [companyName]);

  const steps = [
    {
      icon: Mail,
      title: 'Zugangsdaten per E-Mail',
      description: 'Sie erhalten in Kürze eine E-Mail mit Ihren Zugangsdaten und einem temporären Passwort.',
    },
    {
      icon: Shield,
      title: 'Prüfung durch unser Team',
      description: 'Unser Team prüft Ihre Angaben. Dies dauert in der Regel 1-2 Werktage.',
    },
    {
      icon: Briefcase,
      title: 'Aufträge erhalten',
      description: 'Nach der Freigabe können Sie sofort Aufträge in Ihrer Region sehen und Angebote einreichen.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <DynamicHelmet 
        title="Registrierung erfolgreich | Büeze.ch"
        description="Ihre Handwerker-Registrierung wurde erfolgreich abgeschlossen."
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
              Willkommen bei Büeze.ch!
            </h1>
            
            <p className="text-muted-foreground text-lg">
              {companyName ? (
                <>Ihr Handwerkerkonto für <strong>{companyName}</strong> wurde erfolgreich erstellt.</>
              ) : (
                'Ihr Handwerkerkonto wurde erfolgreich erstellt.'
              )}
            </p>
          </div>

          {/* What's Next */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Nächste Schritte</CardTitle>
              <CardDescription>
                So geht es weiter mit Ihrem Konto
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
              asChild
              className="min-h-[48px]"
            >
              <Link to="/auth">
                Zur Anmeldung
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
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
            Prüfen Sie auch Ihren Spam-Ordner, falls Sie keine E-Mail erhalten.
          </p>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default HandwerkerRegistrationSuccess;
