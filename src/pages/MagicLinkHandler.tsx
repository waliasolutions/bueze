import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MagicLinkHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'validating' | 'success' | 'error'>('validating');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setErrorMessage('Kein Token gefunden');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('validate-magic-token', {
          body: { token }
        });

        if (error || !data?.valid) {
          setStatus('error');
          setErrorMessage(data?.error || 'Ungültiger oder abgelaufener Link');
          return;
        }

        setStatus('success');
        
        setTimeout(() => {
          switch (data.resourceType) {
            case 'lead':
              navigate(`/opportunity/${data.resourceId}`);
              break;
            case 'proposal':
              navigate(`/proposals/${data.resourceId}`);
              break;
            case 'dashboard':
              navigate('/dashboard');
              break;
            case 'conversation':
              navigate(`/messages/${data.resourceId}`);
              break;
            default:
              navigate('/dashboard');
          }
        }, 1000);

      } catch (err) {
        console.error('Magic link validation error:', err);
        setStatus('error');
        setErrorMessage('Ein Fehler ist aufgetreten');
      }
    };

    validateToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === 'validating' && 'Link wird überprüft...'}
            {status === 'success' && 'Erfolgreich!'}
            {status === 'error' && 'Fehler'}
          </CardTitle>
          <CardDescription>
            {status === 'validating' && 'Bitte warten Sie einen Moment'}
            {status === 'success' && 'Sie werden weitergeleitet'}
            {status === 'error' && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {status === 'validating' && (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}
          {status === 'success' && (
            <div className="text-center">
              <div className="text-green-500 text-5xl mb-4">✓</div>
              <p className="text-sm text-muted-foreground">Weiterleitung...</p>
            </div>
          )}
          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="text-destructive text-5xl mb-4">✕</div>
              <Button onClick={() => navigate('/auth')} variant="outline">
                Zur Anmeldung
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MagicLinkHandler;
